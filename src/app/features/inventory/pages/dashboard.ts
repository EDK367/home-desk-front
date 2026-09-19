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
import { ReportService } from '../../../core/services/report';
import { UserSummaryResponse } from '../../../core/models/auth';
import {
  VwProductsLowestStock,
  VwProductsMostInventoryMovement
} from '../../../core/models/views';

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
  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  user: UserSummaryResponse | null = null;
  totalProducts = 0;
  totalInventories = 0;
  lowStockCount = 0;
  totalMovements = 0;

  loadingStats = true;

  // Reportes correspondientes al rol INVENTORY
  lowestStockProducts: VwProductsLowestStock[] = [];
  mostInventoryMovements: VwProductsMostInventoryMovement[] = [];

  loadingLowestStock = true;
  loadingMostMovements = true;

  ngOnInit(): void {
    this.user = this.sessionService.getUser();
    this.loadDashboardData();
    this.loadReportsData();
  }

  loadDashboardData(): void {
    this.loadingStats = true;

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

    this.inventoryService.getInventoryMovements(0, 1).subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalMovements = res.data.totalElements ?? 0;
        }
        this.checkStatsLoaded();
      },
      error: () => this.checkStatsLoaded()
    });
  }

  loadReportsData(): void {
    // 1. Reporte: Productos con menor existencia disponible
    this.loadingLowestStock = true;
    this.reportService.getProductsLowestStock(0, 8).subscribe({
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

    // 2. Reporte: Productos con mayor cantidad de movimientos
    this.loadingMostMovements = true;
    this.reportService.getProductsMostInventoryMovements(0, 8).subscribe({
      next: (res) => {
        this.mostInventoryMovements = res.data?.content || [];
        this.loadingMostMovements = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMostMovements = false;
        this.cdr.detectChanges();
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
}
