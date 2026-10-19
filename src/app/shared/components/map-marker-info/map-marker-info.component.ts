import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FloodReport } from '../../../models/flood-report.model';
import { getSeverityMeta, SeverityMeta } from '../../utils/severity.util';

// Componente reutilizable (ver arquitectura del proyecto: shared/components).
// Se usa desde MapPage vía ModalController cada vez que se toca un marcador.
@Component({
  selector: 'app-map-marker-info',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './map-marker-info.component.html',
  styleUrls: ['./map-marker-info.component.scss']
})
export class MapMarkerInfoComponent {
  @Input() report!: FloodReport;

  constructor(private modalCtrl: ModalController) {}

  get severityMeta(): SeverityMeta {
    return getSeverityMeta(this.report?.severity);
  }

  get formattedDate(): string {
    return new Date(this.report.created_at).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }
}
