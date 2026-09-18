import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SessionService } from '../../../core/services/session';
import { InventoryService } from '../../../core/services/inventory';
import { ProductService } from '../../../core/services/product';
import { UserSummaryResponse } from '../../../core/models/auth';
import { InventoryResponse, InventoryMovementResponse } from '../../../core/models/inventory';

@Component({
  selector: 'app-inventory-dashboard',
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
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  user: UserSummaryResponse | null = null;
  totalProducts = 0;
  totalInventories = 0;
  lowStockCount = 0;
  totalMovements = 0;

  loadingStats = true;
  loadingAlerts = true;
  loadingRecent = true;

  lowStockItems: InventoryResponse[] = [];
  recentMovements: InventoryMovementResponse[] = [];

  ngOnInit(): void {
    this.user = this.sessionService.getUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loadingStats = true;
    this.loadingAlerts = true;
    this.loadingRecent = true;

    this.productService.getProducts(0, 1).subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalProducts = res.data.totalElements ?? 0;
        }
        this.checkStatsLoaded();
      },
      error: () => this.checkStatsLoaded()
    });

    this.inventoryService.getInventories(0, 1).subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalInventories = res.data.totalElements ?? 0;
        }
        this.checkStatsLoaded();
      },
      error: () => this.checkStatsLoaded()
    });

    this.inventoryService.getLowStock(0, 6, 'quantityOnHand', 'ASC').subscribe({
      next: (res) => {
        if (res?.data) {
          this.lowStockCount = res.data.totalElements ?? 0;
          this.lowStockItems = res.data.content || [];
        }
        this.loadingAlerts = false;
        this.checkStatsLoaded();
      },
      error: () => {
        this.loadingAlerts = false;
        this.checkStatsLoaded();
      }
    });

    this.inventoryService.getInventoryMovements(0, 6, 'createdAt', 'DESC').subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalMovements = res.data.totalElements ?? 0;
          this.recentMovements = res.data.content || [];
        }
        this.loadingRecent = false;
        this.checkStatsLoaded();
      },
      error: () => {
        this.loadingRecent = false;
        this.checkStatsLoaded();
      }
    });
  }

  private checkStatsLoaded(): void {
    this.loadingStats = false;
    this.cdr.detectChanges();
  }

  get userFirstName(): string {
    if (!this.user?.fullName) return 'Encargado';
    return this.user.fullName.trim().split(/\s+/)[0];
  }

  formatDate(isoDate?: string): string {
    if (!isoDate) return '-';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoDate;
    }
  }

  getMovementBadgeClass(type?: string): string {
    switch (type) {
      case 'ENTRADA_COMPRA':
        return 'badge-entry';
      case 'SALIDA_VENTA':
        return 'badge-exit';
      case 'AJUSTE_MANUAL':
        return 'badge-adjust';
      default:
        return 'badge-default';
    }
  }

  getMovementLabel(type?: string): string {
    switch (type) {
      case 'ENTRADA_COMPRA':
        return 'Entrada por Compra';
      case 'SALIDA_VENTA':
        return 'Salida por Venta';
      case 'AJUSTE_MANUAL':
        return 'Ajuste Manual';
      default:
        return type || 'Movimiento';
    }
  }
}
