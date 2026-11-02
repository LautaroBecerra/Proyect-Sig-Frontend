import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id: number;
  user_id: number;
  flood_report_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  responded_at: string | null;

  report_description: string | null;
  report_latitude: number;
  report_longitude: number;
  report_incident_type: string | null;
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http
      .get<ApiResponse<Notification[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  markAsRead(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.baseUrl}/${id}/read`, {});
  }
}