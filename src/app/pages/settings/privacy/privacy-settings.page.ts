import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { PrivacySettings } from '../../../models/settings.model';
import { SettingsStateService } from '../../../services/settings-state.service';

@Component({
  selector: 'app-privacy-settings',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './privacy-settings.page.html',
  styleUrls: ['./privacy-settings.page.scss']
})
export class PrivacySettingsPage {
  constructor(
    public settingsState: SettingsStateService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  toggle(key: keyof PrivacySettings): void {
    this.settingsState.privacy[key] = !this.settingsState.privacy[key];
  }

  async confirmDeleteHistory(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar historial',
      message: '¿Seguro que querés eliminar tu historial de reportes? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            // TODO: no hay todavía un endpoint para borrar en masa los
            // reportes de un usuario — por ahora esto es solo visual.
            this.presentToast('Historial eliminado (simulado).', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  private async presentToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
