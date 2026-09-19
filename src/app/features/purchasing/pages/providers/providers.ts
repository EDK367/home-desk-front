import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { SupplierService } from '../../../../core/services/supplier';
import { SupplierProductService } from '../../../../core/services/supplier-product';
import { ProductService } from '../../../../core/services/product';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import {
  SupplierResponse,
  SupplierProductResponse,
  SupplierProductRequest,
  SupplierProductUpdateRequest
} from '../../../../core/models/supplier';
import { ProductResponse } from '../../../../core/models/product';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatOptionModule
  ],
  templateUrl: './providers.html',
  styleUrl: './providers.css'
})
export class Providers implements OnInit, OnDestroy {
  private supplierService = inject(SupplierService);
  private supplierProductService = inject(SupplierProductService);
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private routerSub: Subscription | null = null;

  suppliers: SupplierResponse[] = [];
  filteredSuppliers: SupplierResponse[] = [];
  availableProducts: ProductResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: string = 'name';
  sortOrder: 'ASC' | 'DESC' = 'ASC';
  includeInactive: boolean = false;

  searchTerm = '';

  loading = true;
  savingProduct = false;
  loadingProductsModal = false;

  isDetailModalOpen = false;
  isProductsModalOpen = false;
  isEditProductModalOpen = false;

  selectedSupplier: SupplierResponse | null = null;
  supplierProducts: SupplierProductResponse[] = [];
  selectedSupplierProduct: SupplierProductResponse | null = null;

  modalError: string | null = null;

  linkProductForm: FormGroup = this.fb.group({
    productId: [null, [Validators.required]],
    supplierSku: ['', [Validators.maxLength(30)]],
    cost: [null, [Validators.required, Validators.min(0)]]
  });

  editProductForm: FormGroup = this.fb.group({
    supplierSku: ['', [Validators.maxLength(30)]],
    cost: [null, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadProductsList();

    let initialNavDone = false;
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.startsWith('/purchasing/providers')) {
          if (!initialNavDone) {
            initialNavDone = true;
          } else {
            this.loadSuppliers();
          }
        } else {
          initialNavDone = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  loadProductsList(): void {
    this.productService.getProducts(0, 150, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.availableProducts = res.data.content;
        }
      }
    });
  }

  loadSuppliers(): void {
    const pageIndex = Math.max(0, this.currentPage - 1);

    const cached = this.supplierService.getCachedSuppliers(
      pageIndex,
      this.pageSize,
      this.sortField,
      this.sortOrder,
      this.includeInactive
    );

    if (cached && cached.content && cached.content.length > 0) {
      this.suppliers = cached.content;
      this.filteredSuppliers = [...cached.content];
      this.totalElements = cached.totalElements ?? cached.content.length;
      this.totalPages = Math.max(1, cached.totalPages ?? 1);
      const pageNum = (cached as any).number ?? cached.pageNumber ?? pageIndex;
      this.currentPage = pageNum + 1;
      this.loading = false;
      this.applyFilter();
    } else {
      this.loading = true;
    }

    this.supplierService
      .getSuppliers(pageIndex, this.pageSize, this.sortField, this.sortOrder, this.includeInactive)
      .subscribe({
        next: (res) => {
          if (res?.data) {
            const content = res.data.content || [];
            this.suppliers = content;
            this.filteredSuppliers = [...content];
            this.totalElements = res.data.totalElements ?? content.length;
            this.totalPages = Math.max(1, res.data.totalPages ?? 1);
            const pageNum = (res.data as any).number ?? res.data.pageNumber ?? pageIndex;
            this.currentPage = pageNum + 1;
            this.applyFilter();
          } else {
            this.suppliers = [];
            this.filteredSuppliers = [];
            this.totalElements = 0;
            this.totalPages = 1;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando proveedores:', err);
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
    this.loadSuppliers();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.loadSuppliers();
  }

  onIncludeInactiveChange(include: boolean): void {
    this.includeInactive = include;
    this.currentPage = 1;
    this.loadSuppliers();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadSuppliers();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadSuppliers();
    }
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
      this.filteredSuppliers = [...this.suppliers];
    } else {
      this.filteredSuppliers = this.suppliers.filter(sup => {
        const nameMatch = sup.name?.toLowerCase().includes(term) ?? false;
        const taxMatch = sup.taxNumber?.toLowerCase().includes(term) ?? false;
        const contactMatch = sup.contactName?.toLowerCase().includes(term) ?? false;
        const emailMatch = sup.email?.toLowerCase().includes(term) ?? false;
        const addressMatch = sup.address?.toLowerCase().includes(term) ?? false;

        return nameMatch || taxMatch || contactMatch || emailMatch || addressMatch;
      });
    }
  }

  openDetailModal(supplier: SupplierResponse): void {
    this.selectedSupplier = supplier;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedSupplier = null;
  }

  openProductsModal(supplier: SupplierResponse): void {
    this.selectedSupplier = supplier;
    this.modalError = null;
    this.linkProductForm.reset();
    this.isProductsModalOpen = true;
    this.loadSupplierProducts(supplier.id!);
  }

  loadSupplierProducts(supplierId: number): void {
    this.loadingProductsModal = true;
    this.supplierProductService.getProductsBySupplier(supplierId, 0, 50).subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.supplierProducts = res.data.content;
        } else {
          this.supplierProducts = [];
        }
        this.loadingProductsModal = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.supplierProducts = [];
        this.loadingProductsModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeProductsModal(): void {
    this.isProductsModalOpen = false;
    this.selectedSupplier = null;
    this.supplierProducts = [];
    this.modalError = null;
    this.linkProductForm.reset();
  }

  linkProduct(): void {
    if (this.linkProductForm.invalid || !this.selectedSupplier?.id) {
      this.linkProductForm.markAllAsTouched();
      return;
    }

    const formVal = this.linkProductForm.value;
    const req: SupplierProductRequest = {
      supplierId: this.selectedSupplier.id,
      productId: Number(formVal.productId),
      supplierSku: formVal.supplierSku ? formVal.supplierSku.trim() : undefined,
      cost: Number(formVal.cost)
    };

    this.savingProduct = true;
    this.modalError = null;

    this.supplierProductService.createSupplierProduct(req).subscribe({
      next: () => {
        this.savingProduct = false;
        this.linkProductForm.reset();
        this.loadSupplierProducts(this.selectedSupplier!.id!);
      },
      error: (err) => {
        this.savingProduct = false;
        this.modalError = extractHttpErrorMessage(err) || 'Error al asociar el producto al proveedor.';
        this.cdr.detectChanges();
      }
    });
  }

  openEditProductModal(sp: SupplierProductResponse): void {
    this.selectedSupplierProduct = sp;
    this.editProductForm.patchValue({
      supplierSku: sp.supplierSku || '',
      cost: sp.cost || 0
    });
    this.isEditProductModalOpen = true;
  }

  closeEditProductModal(): void {
    this.isEditProductModalOpen = false;
    this.selectedSupplierProduct = null;
    this.editProductForm.reset();
  }

  saveEditProduct(): void {
    if (this.editProductForm.invalid || !this.selectedSupplierProduct?.id) {
      this.editProductForm.markAllAsTouched();
      return;
    }

    const formVal = this.editProductForm.value;
    const req: SupplierProductUpdateRequest = {
      supplierSku: formVal.supplierSku ? formVal.supplierSku.trim() : undefined,
      cost: Number(formVal.cost)
    };

    this.savingProduct = true;
    this.supplierProductService.updateSupplierProduct(this.selectedSupplierProduct.id, req).subscribe({
      next: () => {
        this.savingProduct = false;
        this.closeEditProductModal();
        if (this.selectedSupplier?.id) {
          this.loadSupplierProducts(this.selectedSupplier.id);
        }
      },
      error: () => {
        this.savingProduct = false;
      }
    });
  }

  unlinkProduct(sp: SupplierProductResponse): void {
    if (!sp.id) return;

    const prodName = sp.product?.name || 'este producto';
    if (confirm(`¿Está seguro de desvincular "${prodName}" de este proveedor?`)) {
      this.supplierProductService.deleteSupplierProduct(sp.id).subscribe({
        next: () => {
          if (this.selectedSupplier?.id) {
            this.loadSupplierProducts(this.selectedSupplier.id);
          }
        },
        error: () => {}
      });
    }
  }

  newPurchaseWithSupplier(supplier: SupplierResponse): void {
    this.router.navigate(['/purchasing/purchases'], {
      queryParams: { action: 'new', supplierId: supplier.id }
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

  formatDate(isoDate?: string): string {
    if (!isoDate) return '—';
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

  getPhoneList(supplier: SupplierResponse): string {
    if (!supplier.phones || supplier.phones.length === 0) return 'Sin teléfono';
    return supplier.phones.map(p => p.phone).filter(Boolean).join(', ');
  }
}
