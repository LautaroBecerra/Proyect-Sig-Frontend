import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser } from '../models/auth.model';

export interface UpdateProfileDto {
  username: string;
  email: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  updateProfile(
    id: number,
    data: UpdateProfileDto
  ): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(
      `${this.baseUrl}/${id}`,
      data
    );
  }
  
  changePassword(
    id: number,
    data: { currentPassword: string; newPassword: string }
  ): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}/password`,
      data
    );
  }
}