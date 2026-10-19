import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {IonApp, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';

interface AppPage {
  title: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [
    IonApp,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    RouterLink,
    RouterLinkActive
  ]
})
export class AppComponent implements OnInit {
  // A medida que existan pages/login, pages/flood-reports, etc. se agregan
  // acá con el mismo patrón (title + url + icon) y aparecen solas en el
  // menú, sin tocar el HTML. "Mapa" no está listado a propósito: es la
  // página raíz de la app, siempre estás ahí, no hace falta un link a sí misma.

get appPages(): AppPage[] {
  const pages: AppPage[] = [];

  // Solo los administradores ven este botón.
  if (this.authService.currentUser?.role === 'admin') {
    pages.push({
      title: 'Administración',
      url: '/admin',
      icon: 'shield-checkmark-outline'
    });
  }
  pages.push(
    {
      title: 'Mis reportes',
      url: '/my-reports',
      icon: 'document-text-outline'
    },
    {
      title: 'Configuración',
      url: '/settings',
      icon: 'settings-outline'
    }
  );
  return pages;
}
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Si quedó un token guardado de una sesión anterior, lo validamos
    // contra /api/auth/me (punto 5 del pedido). Si el backend lo rechaza
    // (ej. expiró a los 7 días), limpiamos la sesión local en vez de
    // dejarla "colgada" con un token que ya no sirve.
    if (this.authService.isAuthenticated()) {
      this.authService.fetchCurrentUser().subscribe({
        error: () => this.authService.logout()
      });
    }
  }
}
