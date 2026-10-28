import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { SettingsStateService } from '../../../services/settings-state.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

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
  savingAccount = false;

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private settingsState: SettingsStateService,
    private authService: AuthService,
    private userService: UserService
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

    const user = this.authService.currentUser;

    if (!user) {
      this.presentToast(
        'No se encontró una sesión activa. Volvé a iniciar sesión.',
        'warning'
      );
      return;
    }

    const formValue = this.accountForm.getRawValue();
    const username = String(formValue.name).trim();
    const email = String(formValue.email).trim();

    if (!username || !email) {
      this.presentToast(
        'El nombre y el correo son obligatorios.',
        'warning'
      );
      return;
    }

    this.savingAccount = true;

    this.userService.updateProfile(user.id, {
      username,
      email
    }).subscribe({
      next: (response) => {
        this.savingAccount = false;

        this.authService.updateCurrentUser({
          username: response.data.username,
          email: response.data.email
        });

        this.settingsState.account = {
          ...this.settingsState.account,
          name: response.data.username ?? username,
          email: response.data.email,
          phone: formValue.phone ?? ''
        };

        this.accountForm.patchValue({
          name: response.data.username,
          email: response.data.email
        });

        this.presentToast(
          'Datos de la cuenta actualizados correctamente.',
          'success'
        );
      },
      error: (error) => {
        this.savingAccount = false;

        const message =
          error?.error?.message ??
          'No se pudieron actualizar los datos de la cuenta.';

        this.presentToast(message, 'danger');
      }
    });
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

    const user = this.authService.currentUser;

    if (!user) {
      this.presentToast(
        'No se encontró una sesión activa. Volvé a iniciar sesión.',
        'warning'
      );
      return;
    }

    const { currentPassword, newPassword } =
      this.passwordForm.getRawValue();

    if (currentPassword === newPassword) {
      this.presentToast(
        'La nueva contraseña debe ser diferente de la actual.',
        'warning'
      );
      return;
    }

    this.userService.changePassword(user.id, {
      currentPassword,
      newPassword
    }).subscribe({
      next: (response) => {
        this.presentToast(
          response.message || 'Contraseña actualizada correctamente.',
          'success'
        );

        this.passwordForm.reset();
        this.showPasswordForm = false;
      },
      error: (error) => {
        const message =
          error?.error?.message ??
          'No se pudo cambiar la contraseña. Intentá nuevamente.';

        this.presentToast(message, 'danger');
      }
    });
  }

private async presentToast(
    message: string,
    color: string
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });

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
