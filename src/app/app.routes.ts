import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
  path: 'admin',
  canActivate: [adminGuard],
  loadComponent: () =>
    import('./pages/admin/admin.page').then(m => m.AdminPage)
  },
  {
    path: '',
    redirectTo: 'map',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'map',
    loadComponent: () => import('./pages/map/map.page').then(m => m.MapPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    // Única ruta protegida por ahora (datos personales). Para proteger
    // cualquier otra, alcanza con agregar "canActivate: [authGuard]" igual
    // que acá — el mapa y el resto de Configuración siguen públicos a propósito.
    path: 'settings/account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/settings/account/account-settings.page').then(m => m.AccountSettingsPage)
  },
  {
    path: 'settings/notifications',
    loadComponent: () =>
      import('./pages/settings/notifications/notifications-settings.page').then(
        m => m.NotificationsSettingsPage
      )
  },
  {
    path: 'settings/map',
    loadComponent: () =>
      import('./pages/settings/map/map-settings.page').then(m => m.MapSettingsPage)
  },
  {
    path: 'settings/privacy',
    loadComponent: () =>
      import('./pages/settings/privacy/privacy-settings.page').then(m => m.PrivacySettingsPage)
  },
  {
    path: 'settings/about',
    loadComponent: () => import('./pages/settings/about/about.page').then(m => m.AboutPage)
  }
  // A medida que se agreguen las demás páginas (login, register, flood-reports, profile)
  // se van sumando acá con el mismo patrón de loadComponent.
];
