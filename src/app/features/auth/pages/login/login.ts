import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth';
import { TokenService } from '../../../../core/services/token';
import { SessionService } from '../../../../core/services/session';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  // estado del componente
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  // formulario con validaciones
  form: FormGroup = this.formBuilder.group({
    usernameOrEmail: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(5)]],
  });

  // accesores rapidos para el template
  get usernameOrEmail() { return this.form.get('usernameOrEmail')!; }
  get password() { return this.form.get('password')!; }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.value).subscribe({
      next: ({ data }) => {
        // gaurdar el token y redirigir segun el rol
        this.tokenService.saveTokens(
          data.accessToken,
          data.refreshToken,
          data.refreshExpirationSeconds
        );
        this.sessionService.saveUser(data.user);
        this.isLoading.set(false);

        this.navigateArea(data.user.role);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Error al iniciar sesión');
        this.isLoading.set(false);
      },
    });
  }

  navigateArea(role: string): void {

    switch (role) {
      case 'ADMINISTRATION':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'PURCHASING':
        this.router.navigate(['/purchasing/dashboard']);
        break;
      case 'INVENTORY':
        this.router.navigate(['/inventory/dashboard']);
        break;
      case 'SALES':
        this.router.navigate(['/sales/dashboard']);
        break;
      default:
        this.router.navigate(['/admin/dashboard']);
        break;
    }
  }
}
