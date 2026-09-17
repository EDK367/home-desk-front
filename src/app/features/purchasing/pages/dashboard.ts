import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../core/services/session';
import { PurchaseService } from '../../../core/services/purchase';
import { SupplierService } from '../../../core/services/supplier';
import { InventoryService } from '../../../core/services/inventory';
import { UserSummaryResponse } from '../../../core/models/auth';
import { PurchaseResponse } from '../../../core/models/purchase';
import { InventoryResponse } from '../../../core/models/inventory';

@Component({
  selector: 'app-purchasing-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private sessionService = inject(SessionService);
  private purchaseService = inject(PurchaseService);
  private supplierService = inject(SupplierService);
  private inventoryService = inject(InventoryService);
  private cdr = inject(ChangeDetectorRef);

  user: UserSummaryResponse | null = null;
  totalPurchases = 0;
  totalSuppliers = 0;
  totalSpending = 0;
  lowStockCount = 0;

  loadingStats = true;
  loadingRecent = true;
  loadingAlerts = true;

  recentPurchases: PurchaseResponse[] = [];
  lowStockItems: InventoryResponse[] = [];

  ngOnInit(): void {
    this.user = this.sessionService.getUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loadingStats = true;
    this.loadingRecent = true;
    this.loadingAlerts = true;

    // Cargar compras recientes y total
    this.purchaseService.getPurchases(0, 5, 'purchaseDate', 'DESC').subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalPurchases = res.data.totalElements ?? 0;
          this.recentPurchases = res.data.content || [];

          // Calcular monto representativo acumulado
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

    // Cargar total de proveedores registrados
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

    // Cargar alertas de stock bajo que requieren compra
    this.inventoryService.getLowStock(0, 5, 'quantityOnHand', 'ASC').subscribe({
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

  getStatusLabel(statusName?: string): string {
    switch (statusName) {
      case 'RECIBIDA':
        return 'Recibida en bodega';
      case 'APROBADA':
        return 'Aprobada';
      case 'EN_TRANSITO':
        return 'En tránsito';
      case 'SOLICITADA':
        return 'Solicitada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return statusName || 'Desconocido';
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
