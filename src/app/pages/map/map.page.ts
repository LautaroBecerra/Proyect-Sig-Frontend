import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, ModalController, AlertController } from '@ionic/angular';
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
import { interval } from 'rxjs';
import {NotificationService, Notification as AppNotification} from '../../services/notification.service';


// Fix conocido: Leaflet + bundlers modernos rompen las rutas de los íconos default.
// Los archivos referenciados abajo se copian a src/assets/leaflet (ver README).
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png'
});


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
  private reports: FloodReport[] = [];
  private reportsRefreshInterval?: ReturnType<typeof setInterval>;
  private resizeObserver?: ResizeObserver;
  private searchSubscription?: Subscription;
  private notificationPolling?: Subscription;


  selectingLocation = false;
  pressedButton: 'report' | 'locate' | null = null;
  loading = false;

  searchControl = new FormControl('');
  searchResults: GeocodingResult[] = [];
  showSearchResults = false;

  notifications: AppNotification[] = [];
  unreadNotifications = 0;
  showNotifications = false;
  respondingNotificationId: number | null = null;
  
  private readonly defaultCenter: [number, number] = [-33.7458, -61.9671];

  constructor(
    private locationService: LocationService,
    private floodReportService: FloodReportService,
    private geocodingService: GeocodingService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private alertCtrl: AlertController
  ) {}

  async ngAfterViewInit(): Promise<void> {
    this.initMap();
    await this.centerOnUser();
    this.loadReports();
     this.reportsRefreshInterval = setInterval(() => {
    this.loadReports();
      }, 20000);
    this.initSearch();
    this.loadNotifications();

  if (this.authService.isAuthenticated()) {
      this.notificationPolling = interval(60000).subscribe(() => {
      this.loadNotifications();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.reportsRefreshInterval) {
      clearInterval(this.reportsRefreshInterval);
    }
    this.resizeObserver?.disconnect();
    this.searchSubscription?.unsubscribe();
    this.map?.remove();
    this.notificationPolling?.unsubscribe();
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

  respondToNotification(notification: AppNotification, problemPersists: boolean): void {
    if (this.respondingNotificationId !== null) {
      return;
    }

    this.respondingNotificationId = notification.id;

    this.floodReportService.confirmReport(
      notification.flood_report_id,
      problemPersists,
      notification.id
    ).subscribe({
      next: () => {
        this.respondingNotificationId = null;

        const message = problemPersists
          ? 'Gracias por confirmar. Volveremos a consultarte en 3 días.'
          : '¡Gracias! El reporte fue marcado como solucionado.';

        this.presentToast(message, 'success');

        this.loadNotifications();
        this.loadReports();
      },
      error: (error) => {
        this.respondingNotificationId = null;
        this.handleHttpError(error);
      }
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
    this.reports = reports;

    reports.forEach(report => {
      const marker = L.marker([report.latitude, report.longitude])
        .addTo(this.map)
        .on('click', () => this.showReportInfo(report));

      this.reportMarkers.push(marker);
    });
  }

  private async showReportInfo(report: FloodReport): Promise<void> {
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

      const incidentLabels: Record<string, string> = {
        calle_con_agua: 'Calle con agua',
        calle_cortada: 'Calle cortada',
        calle_erosionada: 'Calle erosionada o socavada',
        agua_en_viviendas: 'Agua dentro de viviendas',
        boca_tormenta_obstruida: 'Boca de tormenta obstruida',
        canal_desbordado: 'Canal o zanja desbordada'
      };

      const waterDepthLabels: Record<string, string> = {
        '0_5': '0 a 5 cm',
        '5_20': '5 a 20 cm',
        '20_50': '20 a 50 cm',
        '50_100': '50 cm a 1 m',
        mas_100: 'Más de 1 m'
      };

      const evacuationLabels: Record<string, string> = {
        no: 'No',
        autoevacuacion: 'Sí, nos autoevacuamos.',
        evacuados_organismo:
          'Sí, fuimos evacuados por bomberos, defensa civil u otro organismo.'
      };

      const workLabels: Record<string, string> = {
        actividad_propia: 'No pude realizar mi actividad laboral propia.',
        no_llego: 'No pude llegar a mi lugar de trabajo.',
        perdidas_economicas: 'Se produjeron pérdidas económicas.'
      };

      const serviceLabels: Record<string, string> = {
        sin_luz: 'Sin energía eléctrica.',
        sin_agua: 'Sin agua potable.',
        desborde_cloacal: 'Desborde cloacal.'
      };

      const assistanceLabels: Record<string, string> = {
        limpieza: 'Limpieza y desinfección.',
        colchones: 'Colchones o ropa de cama.',
        alimentos: 'Alimentos.',
        atencion_medica: 'Atención médica.'
      };

      const formData = new FormData();

      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('description', data.descripcion);

      // Tipos de incidente seleccionados.
      const incidentTypes = data.tipoIncidente
        .map(key => incidentLabels[key])
        .filter(Boolean);

      if (incidentTypes.length > 0) {
        formData.append('incident_type', incidentTypes.join(', '));
      }

      // Profundidad del agua.
      if (data.rangoTirante) {
        formData.append(
          'water_depth_range',
          waterDepthLabels[data.rangoTirante]
        );
      }

      // Continuidad del problema.
      if (data.problemaPresente !== null) {
        formData.append(
          'problem_persists',
          String(data.problemaPresente === 'si')
        );
      }

      // Evacuación.
      formData.append(
        'evacuation',
        evacuationLabels[data.privado.evacuacion]
      );

      // Afectación laboral.
      const workDetails = data.privado.trabajoDetalle
        .map(key => workLabels[key])
        .filter(Boolean);

      const workAffected = data.privado.trabajoAfectado
        ? workDetails.join(', ')
        : 'No';

      formData.append('work_affected', workAffected);

      // Servicios afectados.
      const affectedServices = data.privado.serviciosAfectados
        .map(key => serviceLabels[key])
        .filter(Boolean);

      formData.append(
        'services_affected',
        JSON.stringify(affectedServices)
      );

      // Asistencia necesaria.
      const neededAssistance = data.privado.asistenciaNecesaria
        .map(key => assistanceLabels[key])
        .filter(Boolean);

      formData.append(
        'assistance_needed',
        JSON.stringify(neededAssistance)
      );

      // Fotografías.
      data.fotografias?.forEach(foto => {
        formData.append('fotografias', foto);
      });

      this.loading = true;

      this.floodReportService.createReport(formData).subscribe({
        next: response => {
          this.loading = false;

          console.log('REPORTE CREADO:', response);

          this.presentToast(
            'Reporte guardado. Está pendiente de aprobación.',
            'success'
          );
        },
        error: error => {
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

    private loadNotifications(): void {
       console.log('Ejecutando loadNotifications()');

    if (!this.authService.isAuthenticated()) {
       console.log('Usuario no autenticado');
      this.notifications = [];
      this.unreadNotifications = 0;
      return;
    }

    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
            console.log('NOTIFICACIONES RECIBIDAS:', notifications);
        this.notifications = notifications;
        this.unreadNotifications = notifications.filter(
          notification => !notification.is_read
        ).length;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    console.log('Estado:', this.showNotifications);
      if (this.showNotifications) {
    this.loadNotifications();
  }
  }

  markNotificationAsRead(notification: AppNotification): void {
    if (notification.is_read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.is_read = true;

        this.unreadNotifications = this.notifications.filter(
          item => !item.is_read
        ).length;
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  closeNotifications(): void {
  this.showNotifications = false;
  }

  goToReportLocation(
    latitude: number,
    longitude: number,
    reportId: number
  ): void {
    this.closeNotifications();

    this.map.setView([latitude, longitude], 17);

    const report = this.reports.find(
      item => Number(item.id) === Number(reportId)
    );

    if (report) {
      this.showReportInfo(report);
    } else {
      this.presentToast(
        'No se encontró el reporte en el mapa. Actualizá los reportes e intentá nuevamente.',
        'warning'
      );
      this.loadReports();
    }
  }

  async confirmDeleteNotifications(): Promise<void> {

    if (!this.notifications.length) {
      this.presentToast('No hay notificaciones para eliminar.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Borrar historial',
      message: '¿Estás seguro de que querés eliminar todas tus notificaciones? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar todo',
          role: 'destructive',
          handler: () => {
            this.deleteAllNotifications();
          }
        }
      ]
    });

    await alert.present();
  }

  private deleteAllNotifications(): void {
    this.notificationService.deleteAll().subscribe({
      next: (response) => {

        this.notifications = [];
        this.unreadNotifications = 0;

        this.presentToast(
          `Se eliminaron ${response.deletedCount} notificaciones.`,
          'success'
        );

      },
      error: (error) => {
        console.error('Error deleting notifications:', error);
        this.handleHttpError(error);
      }
    });
  }
}