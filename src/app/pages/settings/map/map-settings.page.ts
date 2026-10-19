import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SettingsStateService } from '../../../services/settings-state.service';

@Component({
  selector: 'app-map-settings',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './map-settings.page.html',
  styleUrls: ['./map-settings.page.scss']
})
export class MapSettingsPage {
  constructor(public settingsState: SettingsStateService) {}

  toggle(key: 'showMyLocation' | 'showNearbyReports'): void {
    this.settingsState.mapSettings[key] = !this.settingsState.mapSettings[key];
  }

  setSearchRadius(km: 1 | 5 | 10): void {
    this.settingsState.mapSettings.searchRadiusKm = km;
  }
}
