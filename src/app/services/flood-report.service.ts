import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  CreateFloodReportDto,
  FloodReport,
  UpdateFloodReportDto
} from '../models/flood-report.model';

// Endpoints confirmados contra flood.reports.controller.ts / flood.reports.routes.ts:
//   GET    /api/flood-reports
//   GET    /api/flood-reports/user/:userId
//   GET    /api/flood-reports/:id
//   POST   /api/flood-reports
//   PUT    /api/flood-reports/:id
//   DELETE /api/flood-reports/:id
//
// NO existe todavía endpoint de confirmar/votar reportes en el backend.
// No lo agrego acá hasta que se implemente del lado del servidor.
@Injectable({ providedIn: 'root' })
export class FloodReportService {
  private readonly baseUrl = `${environment.apiUrl}/flood-reports`;

  constructor(private http: HttpClient) {}

  getReports(): Observable<FloodReport[]> {
    return this.http
      .get<ApiResponse<FloodReport[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  updateReportStatus(id: number, status: 'aprobado' | 'rechazado'): Observable<FloodReport> {
    return this.http
      .patch<ApiResponse<FloodReport>>(
        `${this.baseUrl}/${id}/status`,
        { status }
      )
      .pipe(map(res => res.data));
  }

  getReportById(id: number): Observable<FloodReport> {
    return this.http
      .get<ApiResponse<FloodReport>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getReportsByUser(userId: number): Observable<FloodReport[]> {
    return this.http
      .get<ApiResponse<FloodReport[]>>(`${this.baseUrl}/user/${userId}`)
      .pipe(map(res => res.data));
  }

  createReport(report: CreateFloodReportDto): Observable<FloodReport> {
    return this.http
      .post<ApiResponse<FloodReport>>(this.baseUrl, report)
      .pipe(map(res => res.data));
  }

  updateReport(id: number, report: UpdateFloodReportDto): Observable<FloodReport> {
    return this.http
      .put<ApiResponse<FloodReport>>(`${this.baseUrl}/${id}`, report)
      .pipe(map(res => res.data));
  }

  deleteReport(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
