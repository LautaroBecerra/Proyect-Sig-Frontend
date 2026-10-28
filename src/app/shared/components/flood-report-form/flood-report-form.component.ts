import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import {AsistenciaNecesaria, EvacuacionEstado, FloodReportFormValue, INCIDENT_TYPES, IncidentTypeKey, ServicioAfectado, SiNo, TIRANTE_RANGES, TirranteRangeKey, TrabajoDetalle} from '../../../models/flood-report-form.model';

const CONTACT_EMAIL = 'archivohidro@frvt.utn.edu.ar';

// ⚠️ Formulario 100% frontend por ahora. "submit()" NO llama a ningún
// service HTTP — arma el objeto (FloodReportFormValue) y lo devuelve al
// cerrar el modal, para que quien lo abrió decida qué hacer (hoy: mostrar
// un mensaje y loguearlo por consola; a futuro: mandarlo al backend real).
@Component({
  selector: 'app-flood-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './flood-report-form.component.html',
  styleUrls: ['./flood-report-form.component.scss']
})
export class FloodReportFormComponent implements OnInit {
  readonly incidentTypes = INCIDENT_TYPES;
  readonly tirranteRanges = TIRANTE_RANGES;
  readonly contactEmail = CONTACT_EMAIL;

  form!: FormGroup;

  photoPreviewUrl: string | null = null;
  private photoFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tipoIncidente: [[] as IncidentTypeKey[], [Validators.required]],
      rangoTirante: [null as TirranteRangeKey | null, [Validators.required]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      problemaPresente: [null as SiNo | null, [Validators.required]],

      seguimiento: this.fb.group({
        aguaViviendaNormalizada: [null as SiNo | null],
        calleTransitable: [null as SiNo | null],
        calleReparada: [null as SiNo | null]
      }),

      privado: this.fb.group({
        evacuacion: ['no' as EvacuacionEstado],
        familiaRegreso: [null as SiNo | null],
        trabajoAfectado: [false],
        trabajoDetalle: [[] as TrabajoDetalle[]],
        actividadRetomada: [null as SiNo | null],
        serviciosAfectados: [[] as ServicioAfectado[]],
        asistenciaNecesaria: [[] as AsistenciaNecesaria[]]
      })
    });
  }

  // ---------- Tipo de incidente (multi-select tipo "chip") ----------

  get selectedIncidentTypes(): IncidentTypeKey[] {
    return this.form.get('tipoIncidente')?.value ?? [];
  }

  isIncidentSelected(key: IncidentTypeKey): boolean {
    return this.selectedIncidentTypes.includes(key);
  }

  toggleIncidentType(key: IncidentTypeKey): void {
    const current = this.selectedIncidentTypes;
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    this.form.get('tipoIncidente')?.setValue(next);

    // "Si se deselecciona una opción → ocultar su pregunta correspondiente
    // y limpiar su respuesta" (punto 9 del pedido).
    if (!next.includes(key)) {
      this.clearSeguimientoFor(key);
    }
  }

  private clearSeguimientoFor(key: IncidentTypeKey): void {
    const seguimiento = this.form.get('seguimiento');
    if (key === 'agua_en_viviendas') seguimiento?.get('aguaViviendaNormalizada')?.setValue(null);
    if (key === 'calle_cortada') seguimiento?.get('calleTransitable')?.setValue(null);
    if (key === 'calle_erosionada') seguimiento?.get('calleReparada')?.setValue(null);
  }

  setRangoTirante(key: TirranteRangeKey): void {
    this.form.get('rangoTirante')?.setValue(key);
  }

  setProblemaPresente(value: SiNo): void {
    this.form.get('problemaPresente')?.setValue(value);
  }

  setSeguimiento(control: 'aguaViviendaNormalizada' | 'calleTransitable' | 'calleReparada', value: SiNo): void {
    this.form.get(`seguimiento.${control}`)?.setValue(value);
  }

  // ---------- Sección privada ----------

  setEvacuacion(value: EvacuacionEstado): void {
    this.form.get('privado.evacuacion')?.setValue(value);
    if (value === 'no') {
      this.form.get('privado.familiaRegreso')?.setValue(null);
    }
  }

  setFamiliaRegreso(value: SiNo): void {
    this.form.get('privado.familiaRegreso')?.setValue(value);
  }

  get trabajoAfectado(): boolean {
    return !!this.form.get('privado.trabajoAfectado')?.value;
  }

  toggleTrabajoAfectado(): void {
    const next = !this.trabajoAfectado;
    this.form.get('privado.trabajoAfectado')?.setValue(next);
    if (!next) {
      this.form.get('privado.trabajoDetalle')?.setValue([]);
      this.form.get('privado.actividadRetomada')?.setValue(null);
    }
  }

  isTrabajoDetalleSelected(value: TrabajoDetalle): boolean {
    const list: TrabajoDetalle[] = this.form.get('privado.trabajoDetalle')?.value ?? [];
    return list.includes(value);
  }

  toggleTrabajoDetalle(value: TrabajoDetalle): void {
    this.toggleArrayControl('privado.trabajoDetalle', value);
  }

  setActividadRetomada(value: SiNo): void {
    this.form.get('privado.actividadRetomada')?.setValue(value);
  }

  isServicioSelected(value: ServicioAfectado): boolean {
    const list: ServicioAfectado[] = this.form.get('privado.serviciosAfectados')?.value ?? [];
    return list.includes(value);
  }

  toggleServicio(value: ServicioAfectado): void {
    this.toggleArrayControl('privado.serviciosAfectados', value);
  }

  isAsistenciaSelected(value: AsistenciaNecesaria): boolean {
    const list: AsistenciaNecesaria[] = this.form.get('privado.asistenciaNecesaria')?.value ?? [];
    return list.includes(value);
  }

  toggleAsistencia(value: AsistenciaNecesaria): void {
    this.toggleArrayControl('privado.asistenciaNecesaria', value);
  }

  private toggleArrayControl(path: string, value: string): void {
    const control = this.form.get(path);
    const current: string[] = control?.value ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    control?.setValue(next);
  }

  // ---------- Fotografía ----------
  // Solo se maneja localmente (File + URL.createObjectURL para la
  // vista previa). No se sube a ningún lado todavía.

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setPhoto(file);
  }

  removePhoto(): void {
    this.setPhoto(null);
  }

  private setPhoto(file: File | null): void {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
    this.photoFile = file;
    this.photoPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  // ---------- Envío ----------

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.presentToast(
        'Completá los campos obligatorios: tipo de incidente, tirante, descripción y si el problema sigue presente.',
        'warning'
      );
      return;
    }

    const value: FloodReportFormValue = {
      ...this.form.value,
      fotografia: this.photoFile
    };

    // TODO: acá todavía NO se llama al backend. Cuando exista el endpoint
    // definitivo (y el rol admin / estado de aprobación), este mismo objeto
    // es la base del payload real a enviar por FloodReportService.
    console.log('[FloodReportForm] Reporte armado (mock, no se envió al backend):', value);

    await this.modalCtrl.dismiss(value, 'submitted');
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  private async presentToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'bottom' });
    await toast.present();
  }
}
