import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { TokenService } from '../../../../core/services/token';
import { SessionService } from '../../../../core/services/session';
import { ROLE_MENUS, RoleMenuConfig } from './sidebar';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  readonly currentRole = computed(() => this.sessionService.getRole() || 'ADMINISTRATION');

  readonly menuConfig = computed<RoleMenuConfig>(() => {
    const role = this.currentRole();
    return ROLE_MENUS[role] || ROLE_MENUS['ADMINISTRATION'];
  });

  // carga y navegacion al presionar en el menu
  onMenuClick(route: string): void {
    if (this.router.url.split('?')[0] !== route.split('?')[0]) {
      this.router.navigateByUrl(route);
    }
  }

  onLogout(): void {
    const refreshToken = this.tokenService.getRefreshToken() || undefined;

    this.authService.logout({ refreshToken }).subscribe({
      next: () => this.clearAndRedirect(),
      error: () => this.clearAndRedirect()
    });
  }

  private clearAndRedirect(): void {
    this.tokenService.clearTokens();
    this.sessionService.clearUser();
    this.router.navigate(['/login']);
  }
}
