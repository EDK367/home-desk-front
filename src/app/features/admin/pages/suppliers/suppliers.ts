import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { SupplierService } from '../../../../core/services/supplier';
import { SupplierProductService } from '../../../../core/services/supplier-product';
import { ProductService } from '../../../../core/services/product';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import {
  SupplierResponse,
  SupplierRequest,
  SupplierProductResponse,
  SupplierProductRequest,
  SupplierProductUpdateRequest
} from '../../../../core/models/supplier';
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

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

@Component({
  selector: 'app-admin-suppliers',
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
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css'
})
export class Suppliers implements OnInit {
  private supplierService = inject(SupplierService);
  private supplierProductService = inject(SupplierProductService);
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  suppliers: SupplierResponse[] = [];
  filteredSuppliers: SupplierResponse[] = [];
  availableProducts: ProductResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  searchTerm = '';
  sortField = 'name';
  sortOrder = 'ASC';

  loading = true;
  saving = false;
  savingProduct = false;

  isModalOpen = false;
  isEditMode = false;
  editingSupplierId: number | null = null;
  modalError: string | null = null;

  isProductsModalOpen = false;
  selectedSupplier: SupplierResponse | null = null;
  supplierProducts: SupplierProductResponse[] = [];

  isEditProductModalOpen = false;
  selectedSupplierProduct: SupplierProductResponse | null = null;

  supplierForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    taxNumber: ['', [Validators.required]],
    contactName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]]
  });

  linkProductForm: FormGroup = this.fb.group({
    productId: [null, [Validators.required]],
    supplierSku: [''],
    cost: [0, [Validators.required, Validators.min(0)]]
  });

  editProductForm: FormGroup = this.fb.group({
    supplierSku: [''],
    cost: [0, [Validators.required, Validators.min(0)]]
  });

  toast: ToastState | null = null;
  private toastTimeout: any = null;

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadProductsList();
  }

  loadProductsList(): void {
    this.productService.getProducts(0, 300, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.availableProducts = res.data.content;
        }
      }
    });
  }

  loadSuppliers(): void {
    this.loading = true;
    this.supplierService.getSuppliers(0, 300, 'name', 'ASC', true).subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.suppliers = res.data.content;
        } else {
          this.suppliers = [];
        }
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'Error al cargar proveedores.');
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let result = [...this.suppliers];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(s =>
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.taxNumber && s.taxNumber.toLowerCase().includes(term)) ||
        (s.contactName && s.contactName.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term))
      );
    }

    if (this.sortField === 'name') {
      result.sort((a, b) => {
        const valA = (a.name || '').toLowerCase();
        const valB = (b.name || '').toLowerCase();
        return this.sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    } else if (this.sortField === 'taxNumber') {
      result.sort((a, b) => {
        const valA = (a.taxNumber || '').toLowerCase();
        const valB = (b.taxNumber || '').toLowerCase();
        return this.sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    } else if (this.sortField === 'id') {
      result.sort((a, b) => {
        const valA = a.id || 0;
        const valB = b.id || 0;
        return this.sortOrder === 'ASC' ? valA - valB : valB - valA;
      });
    }

    this.filteredSuppliers = result;
    this.totalElements = result.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
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

  get paginatedSuppliers(): SupplierResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSuppliers.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingSupplierId = null;
    this.modalError = null;
    this.supplierForm.reset({
      name: '',
      taxNumber: '',
      contactName: '',
      phone: '',
      email: '',
      address: ''
    });
    this.isModalOpen = true;
  }

  openEditModal(s: SupplierResponse): void {
    this.isEditMode = true;
    this.editingSupplierId = s.id ?? null;
    this.modalError = null;
    const phoneVal = (s.phones && s.phones.length > 0) ? s.phones[0].phone : '';
    this.supplierForm.patchValue({
      name: s.name || '',
      taxNumber: s.taxNumber || '',
      contactName: s.contactName || '',
      phone: phoneVal || '',
      email: s.email || '',
      address: s.address || ''
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingSupplierId = null;
    this.modalError = null;
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.modalError = null;

    const val = this.supplierForm.value;
    const req: SupplierRequest = {
      name: val.name.trim(),
      taxNumber: val.taxNumber.trim(),
      contactName: val.contactName.trim(),
      phones: [{ phone: val.phone.trim() }],
      email: val.email.trim(),
      address: val.address.trim()
    };

    if (this.isEditMode && this.editingSupplierId) {
      this.supplierService.updateSupplier(this.editingSupplierId, req).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showToast('success', 'Proveedor Modificado', `El proveedor ${req.name} ha sido actualizado.`);
          this.loadSuppliers();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al modificar proveedor.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.supplierService.createSupplier(req).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showToast('success', 'Proveedor Creado', `El proveedor ${req.name} ha sido registrado.`);
          this.loadSuppliers();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al crear proveedor.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteSupplier(s: SupplierResponse): void {
    if (!s.id) return;
    if (confirm(`¿Está seguro de desactivar al proveedor "${s.name}"?`)) {
      this.supplierService.deleteSupplier(s.id).subscribe({
        next: () => {
          this.showToast('success', 'Proveedor Desactivado', 'El proveedor ha sido desactivado.');
          this.loadSuppliers();
        },
        error: (err) => {
          this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'Error al desactivar proveedor.');
        }
      });
    }
  }

  openProductsModal(s: SupplierResponse): void {
    if (!s.id) return;
    this.selectedSupplier = s;
    this.supplierProducts = [];
    this.isProductsModalOpen = true;
    this.linkProductForm.reset({ productId: null, supplierSku: '', cost: 0 });
    this.loadSupplierProducts(s.id);
  }

  closeProductsModal(): void {
    this.isProductsModalOpen = false;
    this.selectedSupplier = null;
    this.supplierProducts = [];
  }

  loadSupplierProducts(supplierId: number): void {
    this.supplierProductService.getProductsBySupplier(supplierId, 0, 100).subscribe({
      next: (res: any) => {
        if (res?.data?.content) {
          this.supplierProducts = res.data.content;
        } else {
          this.supplierProducts = [];
        }
        this.cdr.detectChanges();
      }
    });
  }

  linkProduct(): void {
    if (this.linkProductForm.invalid || !this.selectedSupplier?.id) {
      this.linkProductForm.markAllAsTouched();
      return;
    }

    const val = this.linkProductForm.value;
    const req: SupplierProductRequest = {
      supplierId: this.selectedSupplier.id,
      productId: Number(val.productId),
      supplierSku: val.supplierSku ? val.supplierSku.trim() : undefined,
      cost: Number(val.cost)
    };

    this.savingProduct = true;
    this.supplierProductService.createSupplierProduct(req).subscribe({
      next: () => {
        this.savingProduct = false;
        this.linkProductForm.reset({ productId: null, supplierSku: '', cost: 0 });
        this.showToast('success', 'Producto Vinculado', 'El artículo ha sido asociado al proveedor.');
        this.loadSupplierProducts(this.selectedSupplier!.id!);
      },
      error: (err) => {
        this.savingProduct = false;
        this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'Error al vincular producto.');
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
  }

  saveEditProduct(): void {
    if (this.editProductForm.invalid || !this.selectedSupplierProduct?.id) return;
    const val = this.editProductForm.value;
    const req: SupplierProductUpdateRequest = {
      supplierSku: val.supplierSku ? val.supplierSku.trim() : undefined,
      cost: Number(val.cost)
    };

    this.supplierProductService.updateSupplierProduct(this.selectedSupplierProduct.id, req).subscribe({
      next: () => {
        this.closeEditProductModal();
        this.showToast('success', 'Producto Actualizado', 'Costo y SKU del proveedor actualizados.');
        if (this.selectedSupplier?.id) {
          this.loadSupplierProducts(this.selectedSupplier.id);
        }
      },
      error: (err) => {
        this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'Error al actualizar producto.');
      }
    });
  }

  unlinkProduct(sp: SupplierProductResponse): void {
    if (!sp.id) return;
    if (confirm('¿Desea desvincular este producto del proveedor?')) {
      this.supplierProductService.deleteSupplierProduct(sp.id).subscribe({
        next: () => {
          this.showToast('success', 'Producto Desvinculado', 'Se retiró la asociación con el proveedor.');
          if (this.selectedSupplier?.id) {
            this.loadSupplierProducts(this.selectedSupplier.id);
          }
        },
        error: (err) => {
          this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'Error al desvincular producto.');
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
