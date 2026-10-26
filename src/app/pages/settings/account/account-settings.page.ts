import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { SettingsStateService } from '../../../services/settings-state.service';
import { AuthService } from '../../../services/auth.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

// Nombre y email se precargan desde la sesión real (AuthService). "Guardar
// cambios" y "Cambiar contraseña" siguen siendo locales/mock: el backend
// todavía no expone un endpoint para actualizar perfil ni contraseña fuera
// del login. Ver los TODO puntuales más abajo.
@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './account-settings.page.html',
  styleUrls: ['./account-settings.page.scss']
})
export class AccountSettingsPage implements OnInit {
  accountForm: FormGroup;
  passwordForm: FormGroup;
  showPasswordForm = false;

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private settingsState: SettingsStateService,
    private authService: AuthService
  ) {
    this.accountForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    // Nombre/email vienen de la sesión real (AuthService); el teléfono no
    // existe todavía en el backend, así que sigue siendo solo local
    // (SettingsStateService), igual que antes.
    const user = this.authService.currentUser;
    this.accountForm.patchValue({
      name: user?.username ?? this.settingsState.account.name,
      email: user?.email ?? this.settingsState.account.email,
      phone: this.settingsState.account.phone
    });
  }

  saveAccountInfo(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.presentToast('Revisá los datos del formulario.', 'warning');
      return;
    }
    // TODO: reemplazar por UserService.updateProfile(this.accountForm.value)
    // cuando exista el endpoint correspondiente en el backend.
    this.settingsState.account = { ...this.accountForm.value };
    this.presentToast('Datos guardados localmente (todavía no se conecta al backend).', 'success');
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      const message = this.passwordForm.hasError('passwordMismatch')
        ? 'Las contraseñas nuevas no coinciden.'
        : 'Completá los tres campos (mínimo 6 caracteres).';
      this.presentToast(message, 'warning');
      return;
    }
    // TODO: reemplazar por AuthService.changePassword(...) cuando exista auth real.
    this.presentToast('Contraseña actualizada localmente (simulado).', 'success');
    this.passwordForm.reset();
  }

  private async presentToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }

  togglePasswordForm(): void {
  this.showPasswordForm = !this.showPasswordForm;

  if (!this.showPasswordForm) {
    this.passwordForm.reset();
    }
  }

  cancelPasswordChange(): void {
    this.passwordForm.reset();
    this.showPasswordForm = false;
  }
}
