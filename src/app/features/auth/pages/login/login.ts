import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth';
import { TokenService } from '../../../../core/services/token';
import { SessionService } from '../../../../core/services/session';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
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
        this.router.navigate(['/admin']);
        break;
      case 'PURCHASING':
        this.router.navigate(['/purchasing']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }
}
