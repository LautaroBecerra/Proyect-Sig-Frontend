import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { NotificationSettings } from '../../../models/settings.model';
import { SettingsStateService } from '../../../services/settings-state.service';
import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-notifications-settings',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './notifications-settings.page.html',
  styleUrls: ['./notifications-settings.page.scss']
})
export class NotificationsSettingsPage implements OnInit {
   notifications: Notification[] = [];
    loadingNotifications = false;
   deletingNotifications = false;
    unreadNotifications = 0;

  constructor(
    public settingsState: SettingsStateService,
    private notificationService: NotificationService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  toggle(key: keyof NotificationSettings): void {
    this.settingsState.notifications[key] =
      !this.settingsState.notifications[key];
  }

  loadNotifications(): void {
    this.loadingNotifications = true;

    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.updateUnreadCount();
        this.loadingNotifications = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loadingNotifications = false;
        this.presentToast('No se pudieron cargar las notificaciones.', 'danger');
      }
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.is_read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.is_read = true;
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
        this.presentToast('No se pudo marcar como leída.', 'danger');
      }
    });
  }

  async confirmDeleteNotifications(): Promise<void> {
    if (this.notifications.length === 0) return;

    const alert = await this.alertCtrl.create({
      header: 'Borrar historial',
      message: '¿Estás seguro de que querés eliminar todas tus notificaciones?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar todo',
          role: 'destructive',
          handler: () => {
            this.deleteAllNotifications();
          }
        }
      ]
    });

    await alert.present();
  }

  private deleteAllNotifications(): void {
    if (this.deletingNotifications) return;

    this.deletingNotifications = true;

    this.notificationService.deleteAll().subscribe({
      next: (response) => {
        this.notifications = [];
        this.unreadNotifications = 0;
        this.deletingNotifications = false;

        this.presentToast(
          `Se eliminaron ${response.deletedCount} notificaciones.`,
          'success'
        );
      },
      error: (error) => {
        console.error('Error deleting notifications:', error);
        this.deletingNotifications = false;
        this.presentToast('No se pudo borrar el historial.', 'danger');
      }
    });
  }

  private updateUnreadCount(): void {
    this.unreadNotifications =
      this.notifications.filter(n => !n.is_read).length;
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}
