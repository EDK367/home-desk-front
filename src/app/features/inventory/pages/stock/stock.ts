import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { InventoryService } from '../../../../core/services/inventory';
import { ProductService } from '../../../../core/services/product';
import { CategoryService } from '../../../../core/services/category';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import { InventoryResponse, InventoryLotResponse, ManualStockAdjustmentRequest } from '../../../../core/models/inventory';
import { ProductResponse } from '../../../../core/models/product';
import { CategoryResponse } from '../../../../core/models/category';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-inventory-stock',
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
    MatOptionModule,
    MatRadioModule
  ],
  templateUrl: './stock.html',
  styleUrl: './stock.css'
})
export class Stock implements OnInit, OnDestroy {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private routerSub: Subscription | null = null;

  allInventories: InventoryResponse[] = [];
  filteredInventories: InventoryResponse[] = [];
  categories: CategoryResponse[] = [];
  products: ProductResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: string = 'updatedAt';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  searchTerm = '';
  selectedCategoryFilter: string = 'ALL';
  onlyLowStock: boolean = false;

  loading = true;
  savingAdjustment = false;
  loadingLots = false;

  isAdjustModalOpen = false;
  isLotsModalOpen = false;

  selectedInventory: InventoryResponse | null = null;
  activeLots: InventoryLotResponse[] = [];
  modalError: string | null = null;

  adjustForm: FormGroup = this.fb.group({
    productId: [null, [Validators.required]],
    adjustmentType: ['ENTRADA', [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    notes: ['', [Validators.required, Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    this.loadCatalogData();
    this.loadStock();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'adjust') {
        const prodId = params['productId'] ? Number(params['productId']) : undefined;
        this.openAdjustModal(prodId);
      }
    });

    let initialNavDone = false;
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.startsWith('/inventory/stock')) {
          if (!initialNavDone) {
            initialNavDone = true;
          } else {
            this.loadStock();
          }
        } else {
          initialNavDone = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  loadCatalogData(): void {
    this.categoryService.getCategories(0, 50, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.categories = res.data.content;
        }
      }
    });

    this.productService.getProducts(0, 150, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.products = res.data.content;
        }
      }
    });
  }

  loadStock(): void {
    const pageIndex = Math.max(0, this.currentPage - 1);
    this.loading = true;

    if (this.onlyLowStock) {
      this.inventoryService.getLowStock(pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
        next: (res) => this.handleStockResponse(res, pageIndex),
        error: () => this.handleStockError()
      });
    } else if (this.selectedCategoryFilter !== 'ALL') {
      const catId = Number(this.selectedCategoryFilter);
      this.inventoryService.getInventoryByCategory(catId, pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
        next: (res) => this.handleStockResponse(res, pageIndex),
        error: () => this.handleStockError()
      });
    } else {
      this.inventoryService.getInventories(pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
        next: (res) => this.handleStockResponse(res, pageIndex),
        error: () => this.handleStockError()
      });
    }
  }

  private handleStockResponse(res: any, pageIndex: number): void {
    if (res?.data) {
      const content = res.data.content || [];
      this.allInventories = content;
      this.totalElements = res.data.totalElements ?? content.length;
      this.totalPages = Math.max(1, res.data.totalPages ?? 1);
      const pageNum = (res.data as any).number ?? res.data.pageNumber ?? pageIndex;
      this.currentPage = pageNum + 1;
      this.applyFilter();
    } else {
      this.allInventories = [];
      this.filteredInventories = [];
      this.totalElements = 0;
      this.totalPages = 1;
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  private handleStockError(): void {
    this.allInventories = [];
    this.filteredInventories = [];
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
    this.loadStock();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.loadStock();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadStock();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadStock();
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  onCategoryFilterChange(categoryId: string): void {
    this.selectedCategoryFilter = categoryId;
    this.currentPage = 1;
    this.loadStock();
  }

  toggleLowStockFilter(): void {
    this.onlyLowStock = !this.onlyLowStock;
    this.currentPage = 1;
    this.loadStock();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredInventories = [...this.allInventories];
      return;
    }

    this.filteredInventories = this.allInventories.filter(inv => {
      const prodName = inv.product?.name?.toLowerCase().includes(term) ?? false;
      const prodSku = inv.product?.sku?.toLowerCase().includes(term) ?? false;
      const catName = inv.product?.category?.name?.toLowerCase().includes(term) ?? false;
      const idMatch = inv.id?.toString().includes(term) ?? false;
      return prodName || prodSku || catName || idMatch;
    });
  }

  openAdjustModal(productId?: number): void {
    this.modalError = null;
    this.adjustForm.reset({
      productId: productId || null,
      adjustmentType: 'ENTRADA',
      quantity: 1,
      notes: ''
    });

    if (productId) {
      this.selectedInventory = this.allInventories.find(i => i.product?.id === productId) || null;
    } else {
      this.selectedInventory = null;
    }

    this.isAdjustModalOpen = true;
  }

  onProductChanged(): void {
    const pId = this.adjustForm.value.productId;
    if (pId) {
      this.selectedInventory = this.allInventories.find(i => i.product?.id === pId) || null;
    } else {
      this.selectedInventory = null;
    }
  }

  closeAdjustModal(): void {
    this.isAdjustModalOpen = false;
    this.selectedInventory = null;
    this.modalError = null;
    this.adjustForm.reset();

    if (this.route.snapshot.queryParams['action']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { action: null, productId: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  get projectedBalance(): number {
    const current = this.selectedInventory?.quantityOnHand ?? 0;
    const formVal = this.adjustForm.value;
    const qty = Number(formVal.quantity) || 0;
    if (formVal.adjustmentType === 'ENTRADA') {
      return current + qty;
    } else {
      return current - qty;
    }
  }

  saveAdjustment(): void {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }

    const formVal = this.adjustForm.value;
    const productId = Number(formVal.productId);
    const rawQty = Math.abs(Number(formVal.quantity));

    if (rawQty <= 0) {
      this.modalError = 'La cantidad debe ser mayor a 0.';
      return;
    }

    const signedQty = formVal.adjustmentType === 'SALIDA' ? -rawQty : rawQty;
    const currentStock = this.selectedInventory?.quantityOnHand ?? 0;
    if (formVal.adjustmentType === 'SALIDA' && (currentStock + signedQty) < 0) {
      this.modalError = `El ajuste de salida excede las existencias disponibles (${currentStock} unidades).`;
      return;
    }

    const payload: ManualStockAdjustmentRequest = {
      quantity: signedQty,
      notes: formVal.notes ? formVal.notes.trim() : 'Ajuste manual de existencias'
    };

    this.savingAdjustment = true;
    this.modalError = null;

    this.inventoryService.adjustInventoryStock(productId, payload).subscribe({
      next: () => {
        this.savingAdjustment = false;
        this.closeAdjustModal();
        this.loadStock();
      },
      error: (err) => {
        this.savingAdjustment = false;
        this.modalError = extractHttpErrorMessage(err) || 'Error al aplicar el ajuste en inventario.';
        this.cdr.detectChanges();
      }
    });
  }

  openLotsModal(inventory: InventoryResponse): void {
    this.selectedInventory = inventory;
    this.activeLots = [];
    this.isLotsModalOpen = true;

    if (inventory.product?.id) {
      this.loadingLots = true;
      this.inventoryService.getActiveLotsByProduct(inventory.product.id).subscribe({
        next: (res) => {
          this.activeLots = res?.data || [];
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

  closeLotsModal(): void {
    this.isLotsModalOpen = false;
    this.selectedInventory = null;
    this.activeLots = [];
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
}
