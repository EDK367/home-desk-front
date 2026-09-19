import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProductService } from '../../../../core/services/product';
import { CategoryService } from '../../../../core/services/category';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import { ProductResponse, ProductRequest } from '../../../../core/models/product';
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
  selector: 'app-admin-products',
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
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  products: ProductResponse[] = [];
  filteredProducts: ProductResponse[] = [];
  categories: CategoryResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  searchTerm = '';
  selectedCategory: string = 'ALL';
  statusFilter: string = 'ALL';
  sortField = 'name';
  sortOrder = 'ASC';

  loading = true;
  saving = false;

  isModalOpen = false;
  isEditMode = false;
  editingProductId: number | null = null;
  modalError: string | null = null;

  isPriceModalOpen = false;
  selectedProductForPrice: ProductResponse | null = null;
  newPriceValue: number = 0;

  isMinStockModalOpen = false;
  selectedProductForMinStock: ProductResponse | null = null;
  newMinStockValue: number = 0;

  productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    sku: ['', [Validators.required, Validators.maxLength(50)]],
    description: [''],
    categoryId: [null, [Validators.required]],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    minStockLevel: [5, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories(0, 100, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.categories = res.data.content;
        }
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProductsAdmin(0, 500, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.products = res.data.content;
        } else {
          this.products = [];
        }
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let result = [...this.products];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(term))
      );
    }

    if (this.selectedCategory !== 'ALL') {
      const catId = Number(this.selectedCategory);
      result = result.filter(p => p.category?.id === catId);
    }

    if (this.statusFilter === 'ACTIVE') {
      result = result.filter(p => p.isActive !== false);
    } else if (this.statusFilter === 'INACTIVE') {
      result = result.filter(p => p.isActive === false);
    }

    if (this.sortField === 'name') {
      result.sort((a, b) => {
        const valA = (a.name || '').toLowerCase();
        const valB = (b.name || '').toLowerCase();
        return this.sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    } else if (this.sortField === 'sku') {
      result.sort((a, b) => {
        const valA = (a.sku || '').toLowerCase();
        const valB = (b.sku || '').toLowerCase();
        return this.sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    } else if (this.sortField === 'salePrice') {
      result.sort((a, b) => {
        const valA = a.salePrice || 0;
        const valB = b.salePrice || 0;
        return this.sortOrder === 'ASC' ? valA - valB : valB - valA;
      });
    } else if (this.sortField === 'id') {
      result.sort((a, b) => {
        const valA = a.id || 0;
        const valB = b.id || 0;
        return this.sortOrder === 'ASC' ? valA - valB : valB - valA;
      });
    }

    this.filteredProducts = result;
    this.totalElements = result.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onFilterChange();
  }

  onSortFieldChange(field: string): void {
    this.sortField = field;
    this.applyFilter();
  }

  onSortOrderChange(order: string): void {
    this.sortOrder = order;
    this.applyFilter();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.applyFilter();
  }

  get pagesArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginatedProducts(): ProductResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingProductId = null;
    this.modalError = null;
    this.productForm.reset({
      name: '',
      sku: '',
      description: '',
      categoryId: this.categories.length > 0 ? this.categories[0].id : null,
      salePrice: 0,
      minStock: 5
    });
    this.isModalOpen = true;
  }

  openEditModal(p: ProductResponse): void {
    this.isEditMode = true;
    this.editingProductId = p.id ?? null;
    this.modalError = null;
    this.productForm.patchValue({
      name: p.name || '',
      sku: p.sku || '',
      description: p.description || '',
      categoryId: p.category?.id || null,
      salePrice: p.salePrice || 0,
      minStockLevel: p.minStockLevel || 5
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingProductId = null;
    this.modalError = null;
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.modalError = null;

    const val = this.productForm.value;
    const req: ProductRequest = {
      name: val.name.trim(),
      sku: val.sku.trim(),
      description: val.description ? val.description.trim() : undefined,
      categoryId: Number(val.categoryId),
      salePrice: Number(val.salePrice),
      minStockLevel: Number(val.minStockLevel),
      unitOfMeasure: 'UNIT'
    };

    if (this.isEditMode && this.editingProductId) {
      this.productService.updateProduct(this.editingProductId, req).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al actualizar producto.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.productService.createProduct(req).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al crear producto.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleProductStatus(p: ProductResponse): void {
    if (!p.id) return;
    const newStatus = !p.isActive;
    this.productService.updateStatus(p.id, newStatus).subscribe({
      next: () => {
        p.isActive = newStatus;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  openPriceModal(p: ProductResponse): void {
    this.selectedProductForPrice = p;
    this.newPriceValue = p.salePrice || 0;
    this.isPriceModalOpen = true;
  }

  closePriceModal(): void {
    this.isPriceModalOpen = false;
    this.selectedProductForPrice = null;
  }

  savePrice(): void {
    if (!this.selectedProductForPrice?.id || this.newPriceValue < 0) return;
    this.productService.changeSalePrice(this.selectedProductForPrice.id, { salePrice: this.newPriceValue }).subscribe({
      next: () => {
        this.closePriceModal();
        this.loadProducts();
      },
      error: () => {}
    });
  }

  openMinStockModal(p: ProductResponse): void {
    this.selectedProductForMinStock = p;
    this.newMinStockValue = p.minStockLevel || 0;
    this.isMinStockModalOpen = true;
  }

  closeMinStockModal(): void {
    this.isMinStockModalOpen = false;
    this.selectedProductForMinStock = null;
  }

  saveMinStock(): void {
    if (!this.selectedProductForMinStock?.id || this.newMinStockValue < 0) return;
    this.productService.changeMinStock(this.selectedProductForMinStock.id, { minStockLevel: this.newMinStockValue }).subscribe({
      next: () => {
        this.closeMinStockModal();
        this.loadProducts();
      },
      error: () => {}
    });
  }

  deleteProduct(p: ProductResponse): void {
    if (!p.id) return;
    if (confirm(`¿Está seguro de desactivar el producto "${p.name}"?`)) {
      this.productService.deleteProduct(p.id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: () => {}
      });
    }
  }

  formatMoney(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'Q0.00';
    return `Q${amount.toFixed(2)}`;
  }
}
