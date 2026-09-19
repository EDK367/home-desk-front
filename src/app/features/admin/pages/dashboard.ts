import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SessionService } from '../../../core/services/session';
import { UserService } from '../../../core/services/user';
import { RoleService } from '../../../core/services/role';
import { ReportService } from '../../../core/services/report';
import { UserSummaryResponse } from '../../../core/models/auth';
import {
  VwTop10ProductsSold,
  VwTop10ProductsByRevenue,
  VwTop10CustomersBySale,
  VwTop5SuppliersByPurchase,
  VwProductsLowestStock,
  VwProductsMostFrequentlyPurchased,
  VwProductsMostInventoryMovement
} from '../../../core/models/views';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private sessionService = inject(SessionService);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  user: UserSummaryResponse | null = null;
  totalUsers = 0;
  totalRoles = 0;
  loadingStats = true;

  // Reportes
  topProductsSold: VwTop10ProductsSold[] = [];
  topProductsRevenue: VwTop10ProductsByRevenue[] = [];
  topCustomersSales: VwTop10CustomersBySale[] = [];
  topSuppliersPurchases: VwTop5SuppliersByPurchase[] = [];
  lowestStockProducts: VwProductsLowestStock[] = [];
  mostFrequentlyPurchased: VwProductsMostFrequentlyPurchased[] = [];
  mostInventoryMovements: VwProductsMostInventoryMovement[] = [];

  // Estados de carga de reportes
  loadingTopProducts = true;
  loadingTopRevenue = true;
  loadingTopCustomers = true;
  loadingTopSuppliers = true;
  loadingLowestStock = true;
  loadingFrequentPurchases = true;
  loadingMovements = true;

  ngOnInit(): void {
    this.user = this.sessionService.getUser();
    this.loadStats();
    this.loadReports();
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

  loadReports(): void {
    // 1. Top 10 Productos Más Vendidos
    this.loadingTopProducts = true;
    this.reportService.getTop10ProductsSold().subscribe({
      next: (res) => {
        this.topProductsSold = res.data || [];
        this.loadingTopProducts = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTopProducts = false;
        this.cdr.detectChanges();
      }
    });

    // 2. Top 10 Productos con Mayor Ingreso
    this.loadingTopRevenue = true;
    this.reportService.getTop10ProductsRevenue().subscribe({
      next: (res) => {
        this.topProductsRevenue = res.data || [];
        this.loadingTopRevenue = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTopRevenue = false;
        this.cdr.detectChanges();
      }
    });

    // 3. Top 10 Clientes por Ventas
    this.loadingTopCustomers = true;
    this.reportService.getTop10CustomersSales().subscribe({
      next: (res) => {
        this.topCustomersSales = res.data || [];
        this.loadingTopCustomers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTopCustomers = false;
        this.cdr.detectChanges();
      }
    });

    // 4. Top 5 Proveedores por Compras
    this.loadingTopSuppliers = true;
    this.reportService.getTop5SuppliersPurchases().subscribe({
      next: (res) => {
        this.topSuppliersPurchases = res.data || [];
        this.loadingTopSuppliers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTopSuppliers = false;
        this.cdr.detectChanges();
      }
    });

    // 5. Productos con Menor Stock
    this.loadingLowestStock = true;
    this.reportService.getProductsLowestStock(0, 10).subscribe({
      next: (res) => {
        this.lowestStockProducts = res.data?.content || [];
        this.loadingLowestStock = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingLowestStock = false;
        this.cdr.detectChanges();
      }
    });

    // 6. Productos Adquiridos con Mayor Frecuencia
    this.loadingFrequentPurchases = true;
    this.reportService.getProductsMostFrequentlyPurchased(0, 10).subscribe({
      next: (res) => {
        this.mostFrequentlyPurchased = res.data?.content || [];
        this.loadingFrequentPurchases = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingFrequentPurchases = false;
        this.cdr.detectChanges();
      }
    });

    // 7. Productos con Mayor Movimiento
    this.loadingMovements = true;
    this.reportService.getProductsMostInventoryMovements(0, 10).subscribe({
      next: (res) => {
        this.mostInventoryMovements = res.data?.content || [];
        this.loadingMovements = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMovements = false;
        this.cdr.detectChanges();
      }
    });
  }

  get userFirstName(): string {
    if (!this.user?.fullName) return 'Administrador';
    return this.user.fullName.trim().split(/\s+/)[0];
  }

  formatCurrency(value?: number): string {
    if (value == null) return 'Q 0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(value).replace('GTQ', 'Q');
  }

  formatDate(isoDate?: string): string {
    if (!isoDate) return '—';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoDate;
    }
  }
}
