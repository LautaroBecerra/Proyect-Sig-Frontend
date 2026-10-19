import { Injectable } from '@angular/core';
import { AuthUser } from '../../models/auth.model';

// Única fuente de verdad para la sesión persistida en el navegador. Nada
// más en la app debería llamar a localStorage directo para esto — todo
// pasa por acá (AuthService lo usa internamente).
const TOKEN_KEY = 'psf_auth_token';
const USER_KEY = 'psf_auth_user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
