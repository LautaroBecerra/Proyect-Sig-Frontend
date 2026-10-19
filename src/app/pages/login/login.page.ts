import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';


// Google Identity Services se carga por <script> en index.html (ver
// authInterceptor y README) — no hay paquete npm con tipos oficiales para
// esto, así que lo declaramos global y listo.
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage implements AfterViewInit {
  @ViewChild('googleButton') googleButtonRef?: ElementRef<HTMLDivElement>;

  form: FormGroup;
  loading = false;

  // Controla si mostramos el botón de Google o el aviso de "no configurado
  // todavía". Ver environment.googleClientId.
  googleConfigured = !!environment.googleClientId;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngAfterViewInit(): void {
    if (this.googleConfigured) {
      this.initGoogleButton();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;
    this.loading = true;

    this.authService
      .login(email, password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.completeLogin(),
        error: (err) => this.handleAuthError(err)
      });
  }

  // El <script src="https://accounts.google.com/gsi/client"> de index.html
  // carga async, así que puede no estar listo todavía en ngAfterViewInit —
  // reintentamos unas pocas veces en vez de asumir que ya está.
  private initGoogleButton(attempt = 0): void {
    if (typeof google === 'undefined' || !google?.accounts?.id) {
      if (attempt < 10) {
        setTimeout(() => this.initGoogleButton(attempt + 1), 300);
      }
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => this.onGoogleCredential(response.credential)
    });

    if (this.googleButtonRef) {
      google.accounts.id.renderButton(this.googleButtonRef.nativeElement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 280,
        text: 'continue_with'
      });
    }
  }

  // response.credential es el ID token real que entrega Google — nunca se
  // arma ni se simula acá, solo se reenvía tal cual al backend.
  private onGoogleCredential(credential: string): void {
    this.loading = true;
    this.authService
      .loginWithGoogle(credential)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.completeLogin(),
        error: (err) => this.handleAuthError(err)
      });
  }

  // Ambos caminos (login normal y Google) terminan igual: una vez que hay
  // JWT, se confirma la sesión contra /api/auth/me antes de dejar entrar
  // a la app (diagrama del punto 22 del pedido).
  private completeLogin(): void {
    this.authService.fetchCurrentUser().subscribe({
      next: () => this.router.navigateByUrl('/map'),
      error: () => {
        this.presentToast('No se pudo confirmar la sesión. Probá de nuevo.', 'danger');
        this.authService.logout();
      }
    });
  }

  private handleAuthError(err: any): void {
    let message = 'Ocurrió un error al iniciar sesión. Intentá de nuevo.';
    if (err?.status === 401 || err?.status === 400) {
      message = 'Email o contraseña incorrectos.';
    } else if (err?.status === 0) {
      message = 'No se pudo conectar con el servidor.';
    }
    this.presentToast(message, 'danger');
  }

  private async presentToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'bottom' });
    await toast.present();
  }
}
