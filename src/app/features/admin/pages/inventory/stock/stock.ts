import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { InventoryService } from '../../../../../core/services/inventory';
import { ProductService } from '../../../../../core/services/product';
import { CategoryService } from '../../../../../core/services/category';
import { extractHttpErrorMessage } from '../../../../../core/interceptors/error.interceptor';
import { InventoryResponse, InventoryLotResponse, ManualStockAdjustmentRequest } from '../../../../../core/models/inventory';
import { ProductResponse } from '../../../../../core/models/product';
import { CategoryResponse } from '../../../../../core/models/category';

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
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-admin-stock',
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
    MatRadioModule,
    MatCheckboxModule
  ],
  templateUrl: './stock.html',
  styleUrl: './stock.css'
})
export class AdminStock implements OnInit, OnDestroy {
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
        if (url.includes('/stock')) {
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
    this.categoryService.getCategories(0, 100, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.categories = res.data.content;
        }
      }
    });

    this.productService.getProducts(0, 200, 'name', 'ASC').subscribe({
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
        error: (err) => this.handleStockError(err)
      });
    } else if (this.selectedCategoryFilter !== 'ALL') {
      const catId = Number(this.selectedCategoryFilter);
      this.inventoryService.getInventoryByCategory(catId, pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
        next: (res) => this.handleStockResponse(res, pageIndex),
        error: (err) => this.handleStockError(err)
      });
    } else {
      this.inventoryService.getInventories(pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
        next: (res) => this.handleStockResponse(res, pageIndex),
        error: (err) => this.handleStockError(err)
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

  private handleStockError(err: any): void {
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadStock();
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadStock();
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

  onCategoryFilterChange(newCat: string): void {
    this.selectedCategoryFilter = newCat;
    this.currentPage = 1;
    this.loadStock();
  }

  onLowStockToggle(onlyLow: boolean): void {
    this.onlyLowStock = onlyLow;
    this.currentPage = 1;
    this.loadStock();
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
      this.filteredInventories = [...this.allInventories];
    } else {
      this.filteredInventories = this.allInventories.filter(item => {
        const prodName = item.product?.name?.toLowerCase() || '';
        const sku = item.product?.sku?.toLowerCase() || '';
        const catName = item.product?.category?.name?.toLowerCase() || '';
        const idMatch = item.id?.toString() || '';
        return prodName.includes(term) || sku.includes(term) || catName.includes(term) || idMatch.includes(term);
      });
    }
  }

  openAdjustModal(preselectedProductId?: number): void {
    this.modalError = null;
    this.adjustForm.reset({
      productId: preselectedProductId || null,
      adjustmentType: 'ENTRADA',
      quantity: 1,
      notes: ''
    });
    this.isAdjustModalOpen = true;
  }

  closeAdjustModal(): void {
    this.isAdjustModalOpen = false;
    this.modalError = null;
  }

  saveAdjustment(): void {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }

    const { productId, adjustmentType, quantity, notes } = this.adjustForm.value;
    const finalQuantity = adjustmentType === 'SALIDA' ? -Math.abs(Number(quantity)) : Math.abs(Number(quantity));
    const req: ManualStockAdjustmentRequest = {
      quantity: finalQuantity,
      notes: notes.trim()
    };

    this.savingAdjustment = true;
    this.modalError = null;

    this.inventoryService.adjustInventoryStock(Number(productId), req).subscribe({
      next: () => {
        this.savingAdjustment = false;
        this.closeAdjustModal();
        this.loadStock();
      },
      error: (err) => {
        this.savingAdjustment = false;
        this.modalError = extractHttpErrorMessage(err) || 'Error al aplicar el ajuste manual.';
        this.cdr.detectChanges();
      }
    });
  }

  openLotsModal(inventory: InventoryResponse): void {
    this.selectedInventory = inventory;
    this.activeLots = [];
    this.isLotsModalOpen = true;
    this.loadingLots = true;

    if (inventory.product?.id) {
      this.inventoryService.getActiveLotsByProduct(inventory.product.id).subscribe({
        next: (res) => {
          this.activeLots = res?.data || [];
          this.loadingLots = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.activeLots = [];
          this.loadingLots = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.loadingLots = false;
    }
  }

  closeLotsModal(): void {
    this.isLotsModalOpen = false;
    this.selectedInventory = null;
    this.activeLots = [];
  }
}
