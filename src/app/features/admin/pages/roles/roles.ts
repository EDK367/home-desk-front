import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoleService } from '../../../../core/services/role';
import { RoleResponse } from '../../../../core/models/role';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class Roles implements OnInit {
  private roleService = inject(RoleService);
  private cdr = inject(ChangeDetectorRef);

  roles: RoleResponse[] = [];
  filteredRoles: RoleResponse[] = [];
  searchTerm = '';
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.errorMessage = null;

    this.roleService.getRoles().subscribe({
      next: (res) => {
        if (res?.data) {
          this.roles = res.data;
          this.applyFilter();
        } else {
          this.roles = [];
          this.filteredRoles = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron consultar los roles desde el servidor.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredRoles = [...this.roles];
    } else {
      this.filteredRoles = this.roles.filter(r => {
        const nameMatch = r.name?.toLowerCase().includes(term) ?? false;
        const descMatch = r.description?.toLowerCase().includes(term) ?? false;
        const idMatch = r.id?.toString().includes(term) ?? false;
        return nameMatch || descMatch || idMatch;
      });
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  getRoleBadgeClass(roleName?: string): string {
    switch (roleName) {
      case 'ADMINISTRATION':
        return 'badge-admin';
      case 'PURCHASING':
        return 'badge-purchasing';
      case 'INVENTORY':
        return 'badge-inventory';
      case 'SALES':
        return 'badge-sales';
      default:
        return 'badge-default';
    }
  }
}
