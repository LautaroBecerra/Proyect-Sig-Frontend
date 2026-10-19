import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Protección del lado del cliente: solo controla qué se MUESTRA. La
// seguridad real sigue estando en el backend (AuthMiddleware verificando el
// JWT) — este guard no reemplaza eso, como pediste explícitamente.
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
