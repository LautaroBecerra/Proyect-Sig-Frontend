// Alineado con la interfaz User del backend y las respuestas reales de
// /api/auth/login, /api/auth/login/google y /api/auth/me.
// Nunca incluimos "password" acá: el backend no lo devuelve en ninguna
// respuesta de auth (ni debería).

export type UserRole = 'user' | 'admin';

// Forma que devuelven /login y /login/google (sí trae username).
export interface AuthUser {
  id: number;
  username?: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// El backend espera EXACTAMENTE { credential } — nada de token/googleToken.
export interface GoogleLoginRequest {
  credential: string;
}

export interface AuthResponseData {
  user: AuthUser;
  token: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthResponseData;
}

// /api/auth/me devuelve { id, email, role } — sin username — por eso
// AuthUser.username queda opcional.
export interface MeResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}
