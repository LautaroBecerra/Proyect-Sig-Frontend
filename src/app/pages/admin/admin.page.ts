import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FloodReportService } from '../../services/flood-report.service';
import { FloodReport } from '../../models/flood-report.model';

type ReportStatus = 'pendiente' | 'aprobado' | 'rechazado';
type StatusFilter = 'todos' | ReportStatus;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  reports: FloodReport[] = [];
  filter: StatusFilter = 'pendiente';

  loading = false;
  updatingIds = new Set<number>();
  errorMessage = '';

  constructor(
    private floodReportService: FloodReportService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  get filteredReports(): FloodReport[] {
    if (this.filter === 'todos') {
      return this.reports;
    }

    return this.reports.filter(report => report.status === this.filter);
  }

  get pendingCount(): number {
    return this.reports.filter(report => report.status === 'pendiente').length;
  }

  get approvedCount(): number {
    return this.reports.filter(report => report.status === 'aprobado').length;
  }

  get rejectedCount(): number {
    return this.reports.filter(report => report.status === 'rechazado').length;
  }

  loadReports(): void {
    this.loading = true;
    this.errorMessage = '';

    this.floodReportService.getReports().subscribe({
      next: reports => {
        this.reports = [...reports].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        this.loading = false;
      },
      error: error => {
        console.error('Error al cargar reportes:', error);
        this.errorMessage =
          error.status === 401 || error.status === 403
            ? 'No tenés permisos para consultar los reportes.'
            : 'No se pudieron cargar los reportes. Verificá la conexión con el servidor.';
        this.loading = false;
      },
    });
  }

  async changeStatus(
    report: FloodReport,
    status: Exclude<ReportStatus, 'pendiente'>
  ): Promise<void> {
    const action = status === 'aprobado' ? 'aprobar' : 'rechazar';

    const alert = await this.alertController.create({
      header: `${status === 'aprobado' ? 'Aprobar' : 'Rechazar'} reporte`,
      message: `¿Querés ${action} el reporte #${report.id}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          role: 'confirm',
        },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();

    if (result.role !== 'confirm') {
      return;
    }

    this.updatingIds.add(report.id);

    this.floodReportService.updateReportStatus(report.id, status).subscribe({
      next: updatedReport => {
        this.reports = this.reports.map(item =>
          item.id === report.id
            ? { ...item, ...updatedReport, status }
            : item
        );

        this.updatingIds.delete(report.id);
        this.showToast(`Reporte #${report.id} ${status}.`);
      },
      error: error => {
        console.error('Error al actualizar el estado:', error);
        this.updatingIds.delete(report.id);
        this.showToast(
          error.status === 401 || error.status === 403
            ? 'No tenés permisos para cambiar el estado.'
            : 'No se pudo actualizar el reporte.'
        );
      },
    });
  }

  
  async deleteReport(report: FloodReport): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar reporte',
      message: `¿Estás seguro de que querés eliminar el reporte #${report.id}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'confirm',
        },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();

    if (result.role !== 'confirm') {
      return;
    }

    this.updatingIds.add(report.id);

    this.floodReportService.deleteReport(report.id).subscribe({
      next: () => {
        this.reports = this.reports.filter(
          item => item.id !== report.id
        );

        this.updatingIds.delete(report.id);
        this.showToast(`Reporte #${report.id} eliminado.`);
      },
      error: error => {
        console.error('Error al eliminar el reporte:', error);

        this.updatingIds.delete(report.id);

        this.showToast(
          error.status === 401 || error.status === 403
            ? 'No tenés permisos para eliminar reportes.'
            : 'No se pudo eliminar el reporte.'
        );
      },
    });
  }


  async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
    });

    await toast.present();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  openLocation(report: FloodReport): void {
    const url =
      `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  trackById(_index: number, report: FloodReport): number {
    return report.id;
  }
}
