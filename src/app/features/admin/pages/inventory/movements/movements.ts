import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { InventoryService } from '../../../../../core/services/inventory';
import { ProductService } from '../../../../../core/services/product';
import { extractHttpErrorMessage } from '../../../../../core/interceptors/error.interceptor';
import {
  InventoryMovementResponse,
  InventoryMovementLotResponse
} from '../../../../../core/models/inventory';
import { ProductResponse } from '../../../../../core/models/product';

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
  selector: 'app-admin-movements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
export class AdminMovements implements OnInit, OnDestroy {
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

  selectedMovementLots: InventoryMovementLotResponse[] = [];
  isLotsModalOpen = false;
  selectedMovement: InventoryMovementResponse | null = null;

  ngOnInit(): void {
    this.loadProducts();

    this.route.queryParams.subscribe(params => {
      if (params['productId']) {
        this.selectedProductFilter = params['productId'].toString();
      }
      if (params['type']) {
        this.selectedTypeFilter = params['type'];
      }
      this.loadMovements();
    });

    let initialNavDone = false;
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.includes('/movements')) {
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
    this.productService.getProducts(0, 200, 'name', 'ASC').subscribe({
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
        error: (err) => this.handleMovementsError(err)
      });
    } else {
      this.inventoryService.getInventoryMovements(pageIndex, this.pageSize, this.sortField, this.sortOrder, startIso, endIso, typeParam).subscribe({
        next: (res) => this.handleMovementsResponse(res, pageIndex),
        error: (err) => this.handleMovementsError(err)
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

  private handleMovementsError(err: any): void {
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadMovements();
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadMovements();
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

  onTypeFilterChange(newType: string): void {
    this.selectedTypeFilter = newType;
    this.currentPage = 1;
    this.loadMovements();
  }

  onProductFilterChange(newProdId: string): void {
    this.selectedProductFilter = newProdId;
    this.currentPage = 1;
    this.loadMovements();
  }

  onDateFilterChange(): void {
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
    } else {
      this.filteredMovements = this.allMovements.filter(m => {
        const folioMatch = m.id?.toString() || '';
        const prodMatch = m.product?.name?.toLowerCase() || '';
        const skuMatch = m.product?.sku?.toLowerCase() || '';
        const notesMatch = m.notes?.toLowerCase() || '';
        const userMatch = m.user?.fullName?.toLowerCase() || '';
        return folioMatch.includes(term) || prodMatch.includes(term) || skuMatch.includes(term) || notesMatch.includes(term) || userMatch.includes(term);
      });
    }
  }

  openLotsModal(movement: InventoryMovementResponse): void {
    this.selectedMovement = movement;
    this.selectedMovementLots = [];
    this.isLotsModalOpen = true;

    if (movement.id) {
      this.inventoryService.getMovementLotsByMovementId(movement.id).subscribe({
        next: (res) => {
          this.selectedMovementLots = res?.data || [];
          this.cdr.detectChanges();
        },
        error: () => {
          this.selectedMovementLots = [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeLotsModal(): void {
    this.isLotsModalOpen = false;
    this.selectedMovement = null;
    this.selectedMovementLots = [];
  }

  getMovementTypeLabel(type?: string): string {
    switch (type) {
      case 'ENTRADA_COMPRA': return 'Entrada Compra';
      case 'SALIDA_VENTA': return 'Salida Venta';
      case 'AJUSTE_ENTRADA': return 'Ajuste Entrada';
      case 'AJUSTE_SALIDA': return 'Ajuste Salida';
      case 'DEVOLUCION_COMPRA': return 'Devolución Compra';
      case 'DEVOLUCION_VENTA': return 'Devolución Venta';
      default: return type || 'Movimiento';
    }
  }

  getMovementTypeBadgeClass(type?: string): string {
    if (!type) return 'status-inactive';
    if (type.includes('ENTRADA') || type === 'DEVOLUCION_VENTA') {
      return 'status-active';
    }
    return 'status-warn';
  }

  isPositiveQuantity(type?: string): boolean {
    if (!type) return true;
    return type.includes('ENTRADA') || type === 'DEVOLUCION_VENTA';
  }
}
