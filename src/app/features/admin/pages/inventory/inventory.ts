import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InventoryService } from '../../../../core/services/inventory';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import {
  InventoryResponse,
  InventoryMovementResponse,
  InventoryLotResponse,
  InventoryMovementLotResponse
} from '../../../../core/models/inventory';

import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  private inventoryService = inject(InventoryService);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  inventories: InventoryResponse[] = [];
  filteredInventories: InventoryResponse[] = [];

  movements: InventoryMovementResponse[] = [];
  filteredMovements: InventoryMovementResponse[] = [];

  lots: InventoryLotResponse[] = [];
  filteredLots: InventoryLotResponse[] = [];

  stockSearch = '';
  movementSearch = '';
  movementTypeFilter = 'ALL';
  lotSearch = '';

  loadingStock = true;
  loadingMovements = false;
  loadingLots = false;

  selectedMovementLots: InventoryMovementLotResponse[] = [];
  isMovementLotsModalOpen = false;

  selectedProductLots: InventoryLotResponse[] = [];
  isProductLotsModalOpen = false;
  selectedProductName = '';

  ngOnInit(): void {
    this.loadStock();
  }

  loadStock(): void {
    this.loadingStock = true;
    this.inventoryService.getInventories(0, 500).subscribe({
      next: (res) => {
        this.inventories = res?.data?.content || [];
        this.applyStockFilter();
        this.loadingStock = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingStock = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMovements(): void {
    if (this.movements.length > 0) return;
    this.loadingMovements = true;
    this.inventoryService.getInventoryMovements(0, 500).subscribe({
      next: (res) => {
        this.movements = res?.data?.content || [];
        this.applyMovementsFilter();
        this.loadingMovements = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMovements = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadLots(): void {
    if (this.lots.length > 0) return;
    this.loadingLots = true;
    this.inventoryService.getInventoryLots(0, 500).subscribe({
      next: (res) => {
        this.lots = res?.data?.content || [];
        this.applyLotsFilter();
        this.loadingLots = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingLots = false;
        this.cdr.detectChanges();
      }
    });
  }

  onTabChange(index: number): void {
    if (index === 1) this.loadMovements();
    if (index === 2) this.loadLots();
  }

  applyStockFilter(): void {
    let list = [...this.inventories];
    if (this.stockSearch.trim()) {
      const q = this.stockSearch.toLowerCase().trim();
      list = list.filter(i =>
        (i.product?.name && i.product.name.toLowerCase().includes(q)) ||
        (i.product?.sku && i.product.sku.toLowerCase().includes(q)) ||
        (i.product?.category?.name && i.product.category.name.toLowerCase().includes(q))
      );
    }
    this.filteredInventories = list;
  }

  applyMovementsFilter(): void {
    let list = [...this.movements];
    if (this.movementSearch.trim()) {
      const q = this.movementSearch.toLowerCase().trim();
      list = list.filter(m =>
        (m.product?.name && m.product.name.toLowerCase().includes(q)) ||
        (m.referenceType && m.referenceType.toLowerCase().includes(q)) ||
        (m.referenceId && String(m.referenceId).includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        (m.movementType && m.movementType.toLowerCase().includes(q))
      );
    }
    if (this.movementTypeFilter !== 'ALL') {
      list = list.filter(m => m.movementType === this.movementTypeFilter);
    }
    this.filteredMovements = list;
  }

  applyLotsFilter(): void {
    let list = [...this.lots];
    if (this.lotSearch.trim()) {
      const q = this.lotSearch.toLowerCase().trim();
      list = list.filter(l =>
        (l.id && String(l.id).includes(q)) ||
        (l.purchaseId && String(l.purchaseId).includes(q)) ||
        (l.product?.name && l.product.name.toLowerCase().includes(q))
      );
    }
    this.filteredLots = list;
  }

  openProductLotsModal(inv: InventoryResponse): void {
    if (!inv.product?.id) return;
    this.selectedProductName = inv.product.name || 'Producto';
    this.selectedProductLots = [];
    this.isProductLotsModalOpen = true;

    this.inventoryService.getActiveLotsByProduct(inv.product.id).subscribe({
      next: (res) => {
        this.selectedProductLots = res?.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  closeProductLotsModal(): void {
    this.isProductLotsModalOpen = false;
    this.selectedProductLots = [];
  }

  openMovementLotsModal(m: InventoryMovementResponse): void {
    if (!m.id) return;
    this.selectedMovementLots = [];
    this.isMovementLotsModalOpen = true;

    this.inventoryService.getMovementLotsByMovementId(m.id).subscribe({
      next: (res) => {
        this.selectedMovementLots = res?.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  closeMovementLotsModal(): void {
    this.isMovementLotsModalOpen = false;
    this.selectedMovementLots = [];
  }

  formatMoney(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'Q0.00';
    return `Q${amount.toFixed(2)}`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
