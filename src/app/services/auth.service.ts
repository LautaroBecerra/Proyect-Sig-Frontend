import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, AuthUser, MeResponse } from '../models/auth.model';
import { TokenStorageService } from '../core/services/token-storage.service';

// Endpoints confirmados contra el AuthController real:
//   POST /api/auth/login
//   POST /api/auth/login/google
//   GET  /api/auth/me
// El JWT lo genera y valida siempre el backend — acá solo lo guardamos y lo
// mandamos de vuelta (vía el interceptor) en cada request protegido.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(
    this.tokenStorage.getUser()
  );
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private tokenStorage: TokenStorageService) {}

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  
  updateCurrentUser(changes: Partial<AuthUser>): void {
    const current = this.currentUser;

    if (!current) {
      return;
    }

    const updated: AuthUser = {
      ...current,
      ...changes
    };

    this.tokenStorage.setUser(updated);
    this.currentUserSubject.next(updated);
  }


  isAuthenticated(): boolean {
    return !!this.tokenStorage.getToken();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, {
        username,
        email,
        password
      })
      .pipe(tap((res) => this.persistSession(res)));
  }

  // El backend espera EXACTAMENTE { credential } — el credential es el ID
  // token real que entrega Google Identity Services, nunca inventado acá.
  loginWithGoogle(credential: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login/google`, { credential })
      .pipe(tap((res) => this.persistSession(res)));
  }

  // GET /api/auth/me. Se usa después de login/login-google para confirmar
  // la sesión (ver diagrama del punto 22), y también se puede usar al
  // arrancar la app para validar una sesión ya guardada.
  fetchCurrentUser(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.baseUrl}/me`).pipe(
      tap((res) => {
        // /me no devuelve "username" — lo mezclamos con lo que ya
        // teníamos guardado para no perderlo si vino de un login previo.
        const merged: AuthUser = { ...this.currentUser, ...res.user };
        this.tokenStorage.setUser(merged);
        this.currentUserSubject.next(merged);
      })
    );
  }

  // JWT es stateless: cerrar sesión es solo borrar lo local, sin pegarle
  // al backend (confirmado en el punto 18 del pedido).
  logout(): void {
    this.tokenStorage.clear();
    this.currentUserSubject.next(null);
  }

  private persistSession(res: AuthResponse): void {
    this.tokenStorage.setToken(res.data.token);
    this.tokenStorage.setUser(res.data.user);
    this.currentUserSubject.next(res.data.user);
  }
}
