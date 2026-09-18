import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { InventoryService } from '../../../../core/services/inventory';
import { ProductService } from '../../../../core/services/product';
import { InventoryLotResponse } from '../../../../core/models/inventory';
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
  selector: 'app-inventory-lots',
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
  templateUrl: './lots.html',
  styleUrl: './lots.css'
})
export class Lots implements OnInit, OnDestroy {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private routerSub: Subscription | null = null;

  allLots: InventoryLotResponse[] = [];
  filteredLots: InventoryLotResponse[] = [];
  products: ProductResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: string = 'receivedAt';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  searchTerm = '';
  selectedProductFilter: string = 'ALL';
  onlyActiveLots: boolean = false;

  loading = true;

  ngOnInit(): void {
    this.loadProducts();

    this.route.queryParams.subscribe(params => {
      if (params['productId']) {
        this.selectedProductFilter = params['productId'];
      }
      this.loadLots();
    });

    let initialNavDone = false;
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.startsWith('/inventory/lots')) {
          if (!initialNavDone) {
            initialNavDone = true;
          } else {
            this.loadLots();
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

  loadLots(): void {
    const pageIndex = Math.max(0, this.currentPage - 1);
    this.loading = true;

    if (this.selectedProductFilter !== 'ALL') {
      const prodId = Number(this.selectedProductFilter);
      if (this.onlyActiveLots) {
        this.inventoryService.getActiveLotsByProduct(prodId).subscribe({
          next: (res) => {
            const list = res?.data || [];
            this.allLots = list;
            this.totalElements = list.length;
            this.totalPages = 1;
            this.currentPage = 1;
            this.applyFilter();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => this.handleError()
        });
      } else {
        this.inventoryService.getInventoryLotsByProduct(prodId, pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
          next: (res) => this.handleResponse(res, pageIndex),
          error: () => this.handleError()
        });
      }
    } else {
      this.inventoryService.getInventoryLots(pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
        next: (res) => this.handleResponse(res, pageIndex),
        error: () => this.handleError()
      });
    }
  }

  private handleResponse(res: any, pageIndex: number): void {
    if (res?.data) {
      let content: InventoryLotResponse[] = res.data.content || [];
      if (this.onlyActiveLots) {
        content = content.filter(l => (l.quantityRemaining ?? 0) > 0);
      }
      this.allLots = content;
      this.totalElements = res.data.totalElements ?? content.length;
      this.totalPages = Math.max(1, res.data.totalPages ?? 1);
      const pageNum = (res.data as any).number ?? res.data.pageNumber ?? pageIndex;
      this.currentPage = pageNum + 1;
      this.applyFilter();
    } else {
      this.allLots = [];
      this.filteredLots = [];
      this.totalElements = 0;
      this.totalPages = 1;
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  private handleError(): void {
    this.allLots = [];
    this.filteredLots = [];
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
    this.loadLots();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.loadLots();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadLots();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadLots();
    }
  }

  onProductFilterChange(productId: string): void {
    this.selectedProductFilter = productId;
    this.currentPage = 1;
    this.loadLots();
  }

  toggleActiveLots(): void {
    this.onlyActiveLots = !this.onlyActiveLots;
    this.currentPage = 1;
    this.loadLots();
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
      this.filteredLots = [...this.allLots];
      return;
    }

    this.filteredLots = this.allLots.filter(l => {
      const prodName = l.product?.name?.toLowerCase().includes(term) ?? false;
      const prodSku = l.product?.sku?.toLowerCase().includes(term) ?? false;
      const idMatch = l.id?.toString().includes(term) ?? false;
      const purchaseMatch = l.purchaseId?.toString().includes(term) ?? false;
      return prodName || prodSku || idMatch || purchaseMatch;
    });
  }

  formatDate(isoDate?: string): string {
    if (!isoDate) return '-';
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

  formatCurrency(value?: number): string {
    if (value == null) return 'Q 0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(value).replace('GTQ', 'Q');
  }
}
