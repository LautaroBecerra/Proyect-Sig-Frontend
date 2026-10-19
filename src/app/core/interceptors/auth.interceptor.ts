import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

// Agrega "Authorization: Bearer <token>" automáticamente a los requests
// dirigidos a NUESTRO backend (environment.apiUrl). Deliberadamente NO se
// lo agrega a otras APIs externas (ej. Nominatim en GeocodingService) — ahí
// ese header no corresponde y podría romper el request.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getToken();
  const isOwnBackend = req.url.startsWith(environment.apiUrl);

  if (token && isOwnBackend) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};
