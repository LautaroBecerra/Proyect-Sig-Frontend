import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule, RefresherCustomEvent} from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { FloodReportService } from '../../services/flood-report.service';
import { FloodReport } from '../../models/flood-report.model';

@Component({
  selector: 'app-my-reports',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './my-reports.page.html',
  styleUrls: ['./my-reports.page.scss']
})
export class MyReportsPage implements OnInit {
  reports: FloodReport[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private floodReportService: FloodReportService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(event?: RefresherCustomEvent): void {
    this.errorMessage = '';

    const finishRefresh = () => {
      event?.target.complete();
    };

    // Recuperamos el usuario autenticado.
    const user = this.authService.currentUser;

    if (!user) {
      this.reports = [];
      this.errorMessage = 'No se pudo identificar tu sesión. Iniciá sesión nuevamente.';
      finishRefresh();
      return;
    }

    // /me puede devolver el id dentro de user. Lo validamos antes de consultar.
    const userId = Number(user.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      this.reports = [];
      this.errorMessage = 'No se pudo identificar tu usuario.';
      finishRefresh();
      return;
    }

    this.loading = true;

    this.floodReportService.getReportsByUser(userId)
      .pipe(
        finalize(() => {
          this.loading = false;
          finishRefresh();
        })
      )
      .subscribe({
        next: (reports) => {
          this.reports = reports;
        },
        error: (error) => {
          console.error('Error al cargar mis reportes:', error);

          if (error.status === 401) {
            this.errorMessage = 'Tu sesión venció. Iniciá sesión nuevamente.';
          } else if (error.status === 403) {
            this.errorMessage = 'No tenés permiso para consultar estos reportes.';
          } else {
            this.errorMessage = 'No se pudieron cargar tus reportes. Intentá nuevamente.';
          }
        }
      });
  }
}
