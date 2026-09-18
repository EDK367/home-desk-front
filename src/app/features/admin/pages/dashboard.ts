import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { SessionService } from '../../../core/services/session';
import { UserService } from '../../../core/services/user';
import { RoleService } from '../../../core/services/role';
import { UserSummaryResponse } from '../../../core/models/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private sessionService = inject(SessionService);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private cdr = inject(ChangeDetectorRef);

  user: UserSummaryResponse | null = null;
  totalUsers = 0;
  totalRoles = 0;
  loadingStats = true;

  ngOnInit(): void {
    this.user = this.sessionService.getUser();
    this.loadStats();
  }

  loadStats(): void {
    this.loadingStats = true;

    this.userService.getUsers(0, 1, 'createdAt', 'DESC', true).subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalUsers = res.data.totalElements ?? 0;
        }
        this.loadingStats = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingStats = false;
        this.cdr.detectChanges();
      }
    });

    this.roleService.getRoles().subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalRoles = res.data.length;
        }
        this.cdr.detectChanges();
      }
    });
  }

  get userFirstName(): string {
    if (!this.user?.fullName) return 'Administrador';
    return this.user.fullName.trim().split(/\s+/)[0];
  }
}
