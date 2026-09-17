import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth';
import { SessionService } from '../../../../core/services/session';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import { UserSummaryResponse } from '../../../../core/models/auth';

@Component({
  selector: 'app-purchasing-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private sessionService = inject(SessionService);
  private cdr = inject(ChangeDetectorRef);

  user: UserSummaryResponse | null = null;
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    const cachedUser = this.sessionService.getUser();
    if (cachedUser) {
      this.user = cachedUser;
    }
    this.loadProfile();
  }

  loadProfile(): void {
    if (!this.user) {
      this.loading = true;
    }
    this.errorMessage = null;

    this.authService.getCurrentUser().subscribe({
      next: (res) => {
        if (res?.data) {
          const profileData: UserSummaryResponse = {
            id: res.data.id ?? '',
            employeeNumber: res.data.employeeNumber ?? 0,
            username: res.data.username ?? '',
            fullName: res.data.fullName ?? '',
            email: res.data.email ?? '',
            role: typeof res.data.role === 'string'
              ? res.data.role
              : (res.data.role as any)?.name ?? 'PURCHASING',
            isActive: res.data.isActive ?? true
          };

          this.user = profileData;
          this.sessionService.saveUser(profileData);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (!this.user) {
          this.errorMessage = extractHttpErrorMessage(err) || 'Error al obtener los datos del perfil.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get userInitials(): string {
    if (!this.user?.fullName) return 'CO';
    const parts = this.user.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get roleDisplayName(): string {
    return 'Compras & Abastecimiento (PURCHASING)';
  }
}
