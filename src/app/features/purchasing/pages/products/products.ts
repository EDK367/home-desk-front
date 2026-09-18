import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProductService } from '../../../../core/services/product';
import { CategoryService } from '../../../../core/services/category';
import { InventoryService } from '../../../../core/services/inventory';
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

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

@Component({
  selector: 'app-purchasing-products',
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
  private inventoryService = inject(InventoryService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  products: ProductResponse[] = [];
  filteredProducts: ProductResponse[] = [];
  categories: CategoryResponse[] = [];
  lowStockProductIds = new Set<number>();

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  searchTerm = '';
  selectedCategory: string = 'ALL';
  showOnlyLowStock = false;
  sortField: string = 'name';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  loading = true;
  saving = false;

  isModalOpen = false;
  isEditMode = false;
  editingProductId: number | null = null;
  modalError: string | null = null;

  productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    sku: ['', [Validators.required, Validators.maxLength(50)]],
    description: [''],
    categoryId: [null, [Validators.required]],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    minStockLevel: [5, [Validators.required, Validators.min(0)]]
  });

  toast: ToastState | null = null;
  private toastTimeout: any = null;

  ngOnInit(): void {
    this.loadCategories();
    this.loadLowStock();
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

  loadLowStock(): void {
    this.inventoryService.getLowStock(0, 200).subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.lowStockProductIds = new Set(
            res.data.content.map(i => i.product?.id).filter((id): id is number => typeof id === 'number')
          );
        }
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(0, 500, 'name', 'ASC').subscribe({
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
      error: (err) => {
        this.loading = false;
        this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'Error al cargar catálogo.');
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

    if (this.showOnlyLowStock) {
      result = result.filter(p => p.id && this.lowStockProductIds.has(p.id));
    }

    if (this.sortField) {
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';
        if (this.sortField === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else if (this.sortField === 'sku') {
          valA = (a.sku || '').toLowerCase();
          valB = (b.sku || '').toLowerCase();
        } else if (this.sortField === 'salePrice') {
          valA = a.salePrice ?? 0;
          valB = b.salePrice ?? 0;
        } else if (this.sortField === 'minStockLevel') {
          valA = a.minStockLevel ?? 0;
          valB = b.minStockLevel ?? 0;
        }
        if (valA < valB) return this.sortOrder === 'ASC' ? -1 : 1;
        if (valA > valB) return this.sortOrder === 'ASC' ? 1 : -1;
        return 0;
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
    this.currentPage = 1;
    this.applyFilter();
  }

  onSortOrderChange(order: 'ASC' | 'DESC'): void {
    this.sortOrder = order;
    this.currentPage = 1;
    this.applyFilter();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.applyFilter();
  }

  get pagesArray(): number[] {
    const arr: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      arr.push(i);
    }
    return arr;
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
      minStockLevel: 5
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
          this.showToast('success', 'Producto Actualizado', `El producto ${req.name} ha sido actualizado.`);
          this.loadProducts();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al actualizar el producto.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.productService.createProduct(req).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showToast('success', 'Producto Creado', `El producto ${req.name} ha sido creado con éxito.`);
          this.loadProducts();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al crear el producto.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  formatMoney(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'Q0.00';
    return `Q${amount.toFixed(2)}`;
  }

  showToast(type: 'success' | 'error', title: string, message: string): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast = { show: true, type, title, message };
    this.cdr.detectChanges();
    this.toastTimeout = setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 4500);
  }

  closeToast(): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast = null;
  }
}
