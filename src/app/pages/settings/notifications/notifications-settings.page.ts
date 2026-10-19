import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NotificationSettings } from '../../../models/settings.model';
import { SettingsStateService } from '../../../services/settings-state.service';

@Component({
  selector: 'app-notifications-settings',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './notifications-settings.page.html',
  styleUrls: ['./notifications-settings.page.scss']
})
export class NotificationsSettingsPage {
  constructor(public settingsState: SettingsStateService) {}

  toggle(key: keyof NotificationSettings): void {
    this.settingsState.notifications[key] = !this.settingsState.notifications[key];
  }
}
