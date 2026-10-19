import { Injectable } from '@angular/core';
import { AccountInfo, MapSettings, NotificationSettings, PrivacySettings } from '../models/settings.model';

// providedIn: 'root' → una sola instancia para toda la app. Como cada
// subpágina de /settings/* es una ruta distinta, Angular destruye y recrea
// el componente al navegar entre ellas — si el estado viviera en cada
// página, se perdería. Viviendo acá (un service singleton), sobrevive
// mientras dure la sesión del navegador (se resetea al recargar la página,
// no hay persistencia en disco/backend todavía).
@Injectable({ providedIn: 'root' })
export class SettingsStateService {
  account: AccountInfo = {
    name: '',
    email: '',
    phone: ''
  };

  notifications: NotificationSettings = {
    floodAlerts: true,
    rainAlerts: true,
    nearbyReportAlerts: false
  };

  mapSettings: MapSettings = {
    showMyLocation: true,
    showNearbyReports: true,
    searchRadiusKm: 5
  };

  privacy: PrivacySettings = {
    shareLocation: true,
    allowOthersToSeeMyReports: true
  };
}
