import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { InventoryService } from '../../../../core/services/inventory';
import { ProductService } from '../../../../core/services/product';
import { InventoryMovementResponse, InventoryMovementLotResponse } from '../../../../core/models/inventory';
import { ProductResponse } from '../../../../core/models/product';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-inventory-movements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatOptionModule
  ],
  templateUrl: './movements.html',
  styleUrl: './movements.css'
})
export class Movements implements OnInit, OnDestroy {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private routerSub: Subscription | null = null;

  allMovements: InventoryMovementResponse[] = [];
  filteredMovements: InventoryMovementResponse[] = [];
  products: ProductResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: string = 'createdAt';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  searchTerm = '';
  selectedTypeFilter: string = 'ALL';
  selectedProductFilter: string = 'ALL';
  startDateFilter: string = '';
  endDateFilter: string = '';

  loading = true;
  loadingLots = false;
  isDetailModalOpen = false;

  selectedMovement: InventoryMovementResponse | null = null;
  movementLots: InventoryMovementLotResponse[] = [];

  ngOnInit(): void {
    this.loadProducts();

    this.route.queryParams.subscribe(params => {
      if (params['productId']) {
        this.selectedProductFilter = params['productId'];
      }
      this.loadMovements();
    });

    let initialNavDone = false;
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.startsWith('/inventory/movements')) {
          if (!initialNavDone) {
            initialNavDone = true;
          } else {
            this.loadMovements();
          }
        } else {
          initialNavDone = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  loadProducts(): void {
    this.productService.getProducts(0, 150, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.products = res.data.content;
        }
      }
    });
  }

  loadMovements(): void {
    const pageIndex = Math.max(0, this.currentPage - 1);
    this.loading = true;

    let startIso: string | undefined = undefined;
    let endIso: string | undefined = undefined;
    if (this.startDateFilter) {
      startIso = new Date(this.startDateFilter + 'T00:00:00Z').toISOString();
    }
    if (this.endDateFilter) {
      endIso = new Date(this.endDateFilter + 'T23:59:59Z').toISOString();
    }

    const typeParam = this.selectedTypeFilter !== 'ALL' ? this.selectedTypeFilter : undefined;

    if (this.selectedProductFilter !== 'ALL') {
      const prodId = Number(this.selectedProductFilter);
      this.inventoryService.getMovementsByProduct(prodId, pageIndex, this.pageSize, this.sortField, this.sortOrder, startIso, endIso).subscribe({
        next: (res) => this.handleMovementsResponse(res, pageIndex),
        error: () => this.handleMovementsError()
      });
    } else {
      this.inventoryService.getInventoryMovements(pageIndex, this.pageSize, this.sortField, this.sortOrder, startIso, endIso, typeParam).subscribe({
        next: (res) => this.handleMovementsResponse(res, pageIndex),
        error: () => this.handleMovementsError()
      });
    }
  }

  private handleMovementsResponse(res: any, pageIndex: number): void {
    if (res?.data) {
      const content = res.data.content || [];
      this.allMovements = content;
      this.totalElements = res.data.totalElements ?? content.length;
      this.totalPages = Math.max(1, res.data.totalPages ?? 1);
      const pageNum = (res.data as any).number ?? res.data.pageNumber ?? pageIndex;
      this.currentPage = pageNum + 1;
      this.applyFilter();
    } else {
      this.allMovements = [];
      this.filteredMovements = [];
      this.totalElements = 0;
      this.totalPages = 1;
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  private handleMovementsError(): void {
    this.allMovements = [];
    this.filteredMovements = [];
    this.totalElements = 0;
    this.totalPages = 1;
    this.loading = false;
    this.cdr.detectChanges();
  }

  get pagesArray(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSortFieldChange(newField: string): void {
    this.sortField = newField;
    this.currentPage = 1;
    this.loadMovements();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.loadMovements();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadMovements();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadMovements();
    }
  }

  onTypeFilterChange(type: string): void {
    this.selectedTypeFilter = type;
    this.currentPage = 1;
    this.loadMovements();
  }

  onProductFilterChange(productId: string): void {
    this.selectedProductFilter = productId;
    this.currentPage = 1;
    this.loadMovements();
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    this.loadMovements();
  }

  clearDateFilter(): void {
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.currentPage = 1;
    this.loadMovements();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredMovements = [...this.allMovements];
      return;
    }

    this.filteredMovements = this.allMovements.filter(m => {
      const prodName = m.product?.name?.toLowerCase().includes(term) ?? false;
      const prodSku = m.product?.sku?.toLowerCase().includes(term) ?? false;
      const notesMatch = m.notes?.toLowerCase().includes(term) ?? false;
      const userMatch = m.user?.fullName?.toLowerCase().includes(term) ?? false;
      const idMatch = m.id?.toString().includes(term) ?? false;
      const refMatch = m.referenceId?.toString().includes(term) ?? false;
      return prodName || prodSku || notesMatch || userMatch || idMatch || refMatch;
    });
  }

  openDetailModal(movement: InventoryMovementResponse): void {
    this.selectedMovement = movement;
    this.movementLots = [];
    this.isDetailModalOpen = true;

    if (movement.id) {
      this.loadingLots = true;
      this.inventoryService.getMovementLotsByMovementId(movement.id).subscribe({
        next: (res) => {
          this.movementLots = res?.data || [];
          this.loadingLots = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingLots = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedMovement = null;
    this.movementLots = [];
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

  formatCurrency(value?: number): string {
    if (value == null) return 'Q 0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(value).replace('GTQ', 'Q');
  }

  getMovementBadgeClass(type?: string): string {
    switch (type) {
      case 'ENTRADA_COMPRA':
      case 'AJUSTE_ENTRADA':
        return 'badge-entry';
      case 'SALIDA_VENTA':
      case 'AJUSTE_SALIDA':
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
      case 'AJUSTE_ENTRADA':
        return 'Ajuste Manual (+)';
      case 'AJUSTE_SALIDA':
        return 'Ajuste Manual (-)';
      case 'AJUSTE_MANUAL':
        return 'Ajuste Manual';
      default:
        return type || 'Movimiento';
    }
  }
}
