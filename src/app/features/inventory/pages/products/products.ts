import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd, RouterLink } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { ProductService } from '../../../../core/services/product';
import { CategoryService } from '../../../../core/services/category';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
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

@Component({
  selector: 'app-inventory-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private routerSub: Subscription | null = null;

  allProducts: ProductResponse[] = [];
  filteredProducts: ProductResponse[] = [];
  categories: CategoryResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: string = 'name';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  searchTerm = '';
  selectedCategoryFilter: string = 'ALL';

  loading = true;
  saving = false;

  isPriceModalOpen = false;
  isMinStockModalOpen = false;
  selectedProduct: ProductResponse | null = null;
  modalError: string | null = null;

  priceForm: FormGroup = this.fb.group({
    salePrice: [0, [Validators.required, Validators.min(0.01)]]
  });

  minStockForm: FormGroup = this.fb.group({
    minStockLevel: [1, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();

    let initialNavDone = false;
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.startsWith('/inventory/products')) {
          if (!initialNavDone) {
            initialNavDone = true;
          } else {
            this.loadProducts();
          }
        } else {
          initialNavDone = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  loadCategories(): void {
    this.categoryService.getCategories(0, 50, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.categories = res.data.content;
        }
      }
    });
  }

  loadProducts(): void {
    const pageIndex = Math.max(0, this.currentPage - 1);
    this.loading = true;

    this.productService.getProducts(pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
      next: (res) => {
        if (res?.data) {
          const content = res.data.content || [];
          this.allProducts = content;
          this.totalElements = res.data.totalElements ?? content.length;
          this.totalPages = Math.max(1, res.data.totalPages ?? 1);
          const pageNum = (res.data as any).number ?? res.data.pageNumber ?? pageIndex;
          this.currentPage = pageNum + 1;
          this.applyFilter();
        } else {
          this.allProducts = [];
          this.filteredProducts = [];
          this.totalElements = 0;
          this.totalPages = 1;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.allProducts = [];
        this.filteredProducts = [];
        this.totalElements = 0;
        this.totalPages = 1;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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
    this.loadProducts();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.loadProducts();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  onCategoryFilterChange(categoryId: string): void {
    this.selectedCategoryFilter = categoryId;
    this.applyFilter();
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

    this.filteredProducts = this.allProducts.filter(p => {
      if (this.selectedCategoryFilter !== 'ALL') {
        const catId = Number(this.selectedCategoryFilter);
        if (p.category?.id !== catId) {
          return false;
        }
      }

      if (!term) return true;

      const nameMatch = p.name?.toLowerCase().includes(term) ?? false;
      const skuMatch = p.sku?.toLowerCase().includes(term) ?? false;
      const descMatch = p.description?.toLowerCase().includes(term) ?? false;
      const catMatch = p.category?.name?.toLowerCase().includes(term) ?? false;
      return nameMatch || skuMatch || descMatch || catMatch;
    });
  }

  openPriceModal(product: ProductResponse): void {
    this.selectedProduct = product;
    this.modalError = null;
    this.priceForm.reset({
      salePrice: product.salePrice ?? 0
    });
    this.isPriceModalOpen = true;
  }

  closePriceModal(): void {
    this.isPriceModalOpen = false;
    this.selectedProduct = null;
    this.modalError = null;
  }

  savePrice(): void {
    if (!this.selectedProduct?.id || this.priceForm.invalid) {
      this.priceForm.markAllAsTouched();
      return;
    }

    const newPrice = Number(this.priceForm.value.salePrice);
    this.saving = true;
    this.modalError = null;

    this.productService.changeSalePrice(this.selectedProduct.id, { salePrice: newPrice }).subscribe({
      next: () => {
        this.saving = false;
        this.closePriceModal();
        this.loadProducts();
      },
      error: (err) => {
        this.saving = false;
        this.modalError = extractHttpErrorMessage(err) || 'Error al actualizar el precio.';
        this.cdr.detectChanges();
      }
    });
  }

  openMinStockModal(product: ProductResponse): void {
    this.selectedProduct = product;
    this.modalError = null;
    this.minStockForm.reset({
      minStockLevel: product.minStockLevel ?? 1
    });
    this.isMinStockModalOpen = true;
  }

  closeMinStockModal(): void {
    this.isMinStockModalOpen = false;
    this.selectedProduct = null;
    this.modalError = null;
  }

  saveMinStock(): void {
    if (!this.selectedProduct?.id || this.minStockForm.invalid) {
      this.minStockForm.markAllAsTouched();
      return;
    }

    const newMinStock = Number(this.minStockForm.value.minStockLevel);
    this.saving = true;
    this.modalError = null;

    this.productService.changeMinStock(this.selectedProduct.id, { minStockLevel: newMinStock }).subscribe({
      next: () => {
        this.saving = false;
        this.closeMinStockModal();
        this.loadProducts();
      },
      error: (err) => {
        this.saving = false;
        this.modalError = extractHttpErrorMessage(err) || 'Error al actualizar el stock mínimo.';
        this.cdr.detectChanges();
      }
    });
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
