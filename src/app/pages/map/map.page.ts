import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import * as L from 'leaflet';
import { LocationService } from '../../services/location.service';
import { FloodReportService } from '../../services/flood-report.service';
import { GeocodingService } from '../../services/geocoding.service';
import { FloodReport } from '../../models/flood-report.model';
import { GeocodingResult } from '../../models/geocoding-result.model';
import { FloodReportFormValue } from '../../models/flood-report-form.model';
import { MapMarkerInfoComponent } from '../../shared/components/map-marker-info/map-marker-info.component';
import { FloodReportFormComponent } from '../../shared/components/flood-report-form/flood-report-form.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';


// Fix conocido: Leaflet + bundlers modernos rompen las rutas de los íconos default.
// Los archivos referenciados abajo se copian a src/assets/leaflet (ver README).
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png'
});

// ⚠️ Nota: hasta hace poco acá creábamos reportes reales contra el backend
// (con un user_id "temporal" mientras no había login). El formulario nuevo
// (FloodReportFormComponent) todavía es 100% mock/frontend — ver el TODO
// en openCreateReportForm() para cuándo se vuelve a conectar de verdad.

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss']
})
export class MapPage implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private userMarker?: L.Marker;
  private searchMarker?: L.Marker;
  private reportMarkers: L.Marker[] = [];
  private resizeObserver?: ResizeObserver;
  private searchSubscription?: Subscription;

  selectingLocation = false;

  // Qué botón circular de abajo está presionado ahora mismo, para mostrarle
  // su tooltip ("Reportar inundación" / "Mi ubicación") mientras lo tocan.
  pressedButton: 'report' | 'locate' | null = null;
  loading = false;

  searchControl = new FormControl('');
  searchResults: GeocodingResult[] = [];
  showSearchResults = false;

  // Centro de Venado Tuerto, Santa Fe (WGS84). Se usa mientras se obtiene
  // la ubicación real del usuario, o si el navegador no da permiso.
  private readonly defaultCenter: [number, number] = [-33.7458, -61.9671];

  constructor(
    private locationService: LocationService,
    private floodReportService: FloodReportService,
    private geocodingService: GeocodingService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngAfterViewInit(): Promise<void> {
    this.initMap();
    await this.centerOnUser();
    this.loadReports();
    this.initSearch();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.searchSubscription?.unsubscribe();
    this.map?.remove();
  }

  // Pipeline de búsqueda: espera que el usuario deje de tipear (debounce),
  // ignora si el texto no cambió, y cancela la búsqueda anterior si llega
  // una letra nueva antes de que responda el servidor (switchMap).
  private initSearch(): void {
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmed = query?.trim() ?? '';
          if (trimmed.length < 3) {
            return of<GeocodingResult[]>([]);
          }
          return this.geocodingService.search(trimmed).pipe(
            catchError(() => {
              this.presentToast('No se pudo buscar la dirección. Intentá de nuevo.', 'warning');
              return of<GeocodingResult[]>([]);
            })
          );
        })
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.showSearchResults = results.length > 0;
      });
  }

  selectSearchResult(result: GeocodingResult): void {
    this.map.setView([result.latitude, result.longitude], 17);

    if (this.searchMarker) {
      this.searchMarker.setLatLng([result.latitude, result.longitude]);
    } else {
      this.searchMarker = L.marker([result.latitude, result.longitude]).addTo(this.map);
    }
    this.searchMarker.bindPopup(result.displayName).openPopup();

    this.showSearchResults = false;
    this.searchResults = [];
    this.searchControl.setValue(result.displayName, { emitEvent: false });
  }

  clearSearch(): void {
    this.searchResults = [];
    this.showSearchResults = false;
  }

  private initMap(): void {
    this.map = L.map('flood-map', {
      center: this.defaultCenter,
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.selectingLocation) {
        this.selectingLocation = false;
        this.openCreateReportForm(e.latlng);
      }
    });

    // Fix del "mapa achicado": ion-content todavía puede no tener su tamaño
    // final cuando Leaflet se inicializa (animación de entrada de la página,
    // toolbar, etc.). Con esto, cada vez que el contenedor cambia de tamaño
    // le avisamos a Leaflet que recalcule — soluciona el bug de raíz en vez
    // de parchearlo con un setTimeout mágico.
    const container = document.getElementById('flood-map');
    if (container) {
      this.resizeObserver = new ResizeObserver(() => this.map.invalidateSize());
      this.resizeObserver.observe(container);
    }

    // Refuerzo extra por si el ResizeObserver no llega a disparar a tiempo
    // en el primer render (pasa en algunos navegadores/dispositivos).
    setTimeout(() => this.map.invalidateSize(), 200);
  }

  async centerOnUser(): Promise<void> {
    try {
      const coords = await this.locationService.getCurrentPosition();
      this.map.setView([coords.latitude, coords.longitude], 15);

      if (this.userMarker) {
        this.userMarker.setLatLng([coords.latitude, coords.longitude]);
      } else {
        this.userMarker = L.marker([coords.latitude, coords.longitude])
          .addTo(this.map)
          .bindPopup('Tu ubicación');
      }
    } catch {
      this.presentToast('No se pudo obtener tu ubicación. Verificá los permisos del navegador/dispositivo.', 'warning');
    }
  }

  private loadReports(): void {
    this.loading = true;

    this.floodReportService.getApprovedReports().subscribe({
      next: (reports) => {
        this.renderReports(reports);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.handleHttpError(err);
      }
    });
  }

  private renderReports(reports: FloodReport[]): void {
    this.reportMarkers.forEach(marker => this.map.removeLayer(marker));
    this.reportMarkers = [];

    reports.forEach(report => {
      const marker = L.marker([report.latitude, report.longitude])
        .addTo(this.map)
        .on('click', () => this.showReportInfo(report));
      this.reportMarkers.push(marker);
    });
  }

  private async showReportInfo(report: FloodReport): Promise<void> {
    // Antes esto era un ion-alert con HTML metido a mano en el "message"
    // (los ion-alert no renderizan HTML por defecto, por eso se veían las
    // etiquetas <b>/<br> literales). Ahora es un modal propio, con diseño
    // de hoja inferior (bottom sheet), igual que al tocar un lugar en
    // Google Maps.
    const modal = await this.modalCtrl.create({
      component: MapMarkerInfoComponent,
      componentProps: { report },
      breakpoints: [0, 0.35, 0.7],
      initialBreakpoint: 0.35,
      handle: false // el componente ya dibuja su propio "handle" visual
    });
    await modal.present();
  }

  toggleSelectLocation(): void {
    this.selectingLocation = !this.selectingLocation;
    if (this.selectingLocation) {
      this.presentToast('Tocá el mapa donde querés reportar la inundación', 'primary');
    }
  }

  refreshReports(): void {
    this.loadReports();
  }


private async openCreateReportForm(latlng: L.LatLng): Promise<void> {
  if (!this.authService.isAuthenticated()) {
    await this.presentToast(
      'Necesitás iniciar sesión para crear un reporte.',
      'warning'
    );

    await this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: '/map'
      }
    });

    return;
  }

  const modal = await this.modalCtrl.create({
    component: FloodReportFormComponent,
    componentProps: {
      latitude: latlng.lat,
      longitude: latlng.lng
    }
  });

  modal.onDidDismiss().then(({ data, role }) => {
  this.handleReportFormResult(data, role, latlng.lat, latlng.lng);
});

  await modal.present();
}

  private handleReportFormResult(
    data: FloodReportFormValue | null,
    role?: string,
    latitude?: number,
    longitude?: number
  ): void {
    if (role !== 'submitted' || !data) {
      return;
    }

    const user = this.authService.currentUser;
    const userId = Number(user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      this.presentToast(
        'No se pudo identificar tu usuario. Iniciá sesión nuevamente.',
        'danger'
      );
      return;
    }

    if (
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      this.presentToast(
        'No se pudieron obtener las coordenadas del reporte.',
        'danger'
      );
      return;
    }

    const payload = {
      user_id: userId,
      latitude,
      longitude,
      description: data.descripcion
    };

    this.loading = true;

    this.floodReportService.createReport(payload).subscribe({
      next: () => {
        this.loading = false;

      this.presentToast(
        'Reporte guardado. Está pendiente de aprobación.',
        'success'
      );
    },
    error: (error) => {
        this.loading = false;
        this.handleHttpError(error);
      }
    });
  }

  private handleHttpError(error: any): void {
    let message = 'Ocurrió un error inesperado. Intentá nuevamente.';
    if (error.status === 0) {
      message = 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.';
    } else if (error.status === 400) {
      message = error?.error?.message || 'Los datos enviados no son válidos.';
    } else if (error.status === 401) {
      message = 'No estás autenticado.';
    } else if (error.status === 403) {
      message = 'No tenés permisos para esta acción.';
    } else if (error.status === 404) {
      message = 'El recurso solicitado no existe.';
    } else if (error.status === 500) {
      message = 'Error interno del servidor.';
    }
    this.presentToast(message, 'danger');
  }

  private async presentToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
