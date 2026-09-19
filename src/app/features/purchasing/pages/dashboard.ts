import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SessionService } from '../../../core/services/session';
import { PurchaseService } from '../../../core/services/purchase';
import { SupplierService } from '../../../core/services/supplier';
import { ReportService } from '../../../core/services/report';
import { UserSummaryResponse } from '../../../core/models/auth';
import { PurchaseResponse } from '../../../core/models/purchase';
import {
  VwTop5SuppliersByPurchase,
  VwProductsMostFrequentlyPurchased,
  VwProductsLowestStock,
  VwTop10ProductsSold
} from '../../../core/models/views';

@Component({
  selector: 'app-purchasing-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private sessionService = inject(SessionService);
  private purchaseService = inject(PurchaseService);
  private supplierService = inject(SupplierService);
  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  user: UserSummaryResponse | null = null;
  totalPurchases = 0;
  totalSuppliers = 0;
  totalSpending = 0;
  lowStockCount = 0;

  loadingStats = true;
  loadingRecent = true;

  // Reportes específicos para el rol de Compras
  topSuppliersPurchases: VwTop5SuppliersByPurchase[] = [];
  mostFrequentlyPurchased: VwProductsMostFrequentlyPurchased[] = [];
  lowestStockProducts: VwProductsLowestStock[] = [];
  topProductsSold: VwTop10ProductsSold[] = [];

  loadingTopSuppliers = true;
  loadingFrequentPurchased = true;
  loadingLowestStock = true;
  loadingTopProducts = true;

  recentPurchases: PurchaseResponse[] = [];

  ngOnInit(): void {
    this.user = this.sessionService.getUser();
    this.loadDashboardData();
    this.loadReportsData();
  }

  loadDashboardData(): void {
    this.loadingStats = true;
    this.loadingRecent = true;

    this.purchaseService.getPurchases(0, 5, 'purchaseDate', 'DESC').subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalPurchases = res.data.totalElements ?? 0;
          this.recentPurchases = res.data.content || [];

          const sum = this.recentPurchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
          this.totalSpending = sum;
        }
        this.loadingRecent = false;
        this.checkStatsLoaded();
      },
      error: () => {
        this.loadingRecent = false;
        this.checkStatsLoaded();
      }
    });

    this.supplierService.getSuppliers(0, 1, 'createdAt', 'DESC', false).subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalSuppliers = res.data.totalElements ?? 0;
        }
        this.checkStatsLoaded();
      },
      error: () => {
        this.checkStatsLoaded();
      }
    });
  }

  loadReportsData(): void {
    // 1. Top 5 Proveedores con mayor compra
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

    // 2. Productos adquiridos con mayor frecuencia
    this.loadingFrequentPurchased = true;
    this.reportService.getProductsMostFrequentlyPurchased(0, 5).subscribe({
      next: (res) => {
        this.mostFrequentlyPurchased = res.data?.content || [];
        this.loadingFrequentPurchased = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingFrequentPurchased = false;
        this.cdr.detectChanges();
      }
    });

    // 3. Productos con menor stock
    this.loadingLowestStock = true;
    this.reportService.getProductsLowestStock(0, 6).subscribe({
      next: (res) => {
        if (res?.data) {
          this.lowestStockProducts = res.data.content || [];
          this.lowStockCount = res.data.totalElements ?? this.lowestStockProducts.length;
        }
        this.loadingLowestStock = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingLowestStock = false;
        this.cdr.detectChanges();
      }
    });

    // 4. Top productos más vendidos (apoyo para compras preventivas)
    this.loadingTopProducts = true;
    this.reportService.getTop10ProductsSold().subscribe({
      next: (res) => {
        this.topProductsSold = (res.data || []).slice(0, 5);
        this.loadingTopProducts = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTopProducts = false;
        this.cdr.detectChanges();
      }
    });
  }

  private checkStatsLoaded(): void {
    this.loadingStats = false;
    this.cdr.detectChanges();
  }

  get userFirstName(): string {
    if (!this.user?.fullName) return 'Comprador';
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

  getStatusBadgeClass(statusName?: string): string {
    switch (statusName) {
      case 'RECIBIDA':
        return 'badge-recibida';
      case 'APROBADA':
        return 'badge-aprobada';
      case 'EN_TRANSITO':
        return 'badge-transito';
      case 'SOLICITADA':
        return 'badge-solicitada';
      case 'CANCELADA':
        return 'badge-cancelada';
      default:
        return 'badge-default';
    }
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
