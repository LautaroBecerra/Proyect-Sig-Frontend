// Todo lo que hay acá es estado 100% local por ahora — no hay contrato con
// el backend todavía para ninguna de estas cosas.

export interface AccountInfo {
  name: string;
  email: string;
  phone: string;
}

export interface NotificationSettings {
  floodAlerts: boolean;
  nearbyReportAlerts: boolean;
}

export interface MapSettings {
  showMyLocation: boolean;
  showNearbyReports: boolean;
  searchRadiusKm: 1 | 5 | 10;
}

export interface PrivacySettings {
  shareLocation: boolean;
  allowOthersToSeeMyReports: boolean;
}
