import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PurchaseService } from '../../../../core/services/purchase';
import { SupplierService } from '../../../../core/services/supplier';
import { ProductService } from '../../../../core/services/product';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import {
  PurchaseResponse,
  PurchaseRequest,
  PurchaseItemRequest,
  PurchaseStatusResponse,
  PurchaseItemResponse
} from '../../../../core/models/purchase';
import { SupplierResponse } from '../../../../core/models/supplier';
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

interface ItemRow {
  productId: number | null;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

@Component({
  selector: 'app-admin-purchases',
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
  templateUrl: './purchases.html',
  styleUrl: './purchases.css'
})
export class Purchases implements OnInit {
  private purchaseService = inject(PurchaseService);
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  purchases: PurchaseResponse[] = [];
  filteredPurchases: PurchaseResponse[] = [];
  suppliers: SupplierResponse[] = [];
  products: ProductResponse[] = [];
  statuses: PurchaseStatusResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  searchTerm = '';
  selectedStatus: string = 'ALL';
  sortField = 'id';
  sortOrder = 'DESC';

  loading = true;
  saving = false;

  isModalOpen = false;
  isDetailModalOpen = false;
  selectedPurchase: PurchaseResponse | null = null;
  selectedPurchaseItems: PurchaseItemResponse[] = [];

  isStatusModalOpen = false;
  newStatusIdToApply: number | null = null;

  modalError: string | null = null;

  purchaseForm: FormGroup = this.fb.group({
    supplierId: [null, [Validators.required]],
    notes: ['']
  });

  itemRows: ItemRow[] = [];

  ngOnInit(): void {
    this.loadCatalogData();
    this.loadPurchases();
  }

  loadCatalogData(): void {
    this.supplierService.getSuppliers(0, 100, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) this.suppliers = res.data.content;
      }
    });

    this.productService.getProducts(0, 300, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) this.products = res.data.content;
      }
    });

    this.purchaseService.getPurchaseStatuses().subscribe({
      next: (res) => {
        if (res?.data) this.statuses = res.data;
      }
    });
  }

  loadPurchases(): void {
    this.loading = true;
    this.purchaseService.getPurchases(0, 500, 'purchaseDate', 'DESC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.purchases = res.data.content;
        } else {
          this.purchases = [];
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
    let result = [...this.purchases];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        (p.supplier?.name && p.supplier.name.toLowerCase().includes(term)) ||
        (p.id && String(p.id).includes(term)) ||
        (p.notes && p.notes.toLowerCase().includes(term))
      );
    }

    if (this.selectedStatus !== 'ALL') {
      const sId = Number(this.selectedStatus);
      result = result.filter(p => p.status?.id === sId);
    }

    if (this.sortField === 'id') {
      result.sort((a, b) => {
        const valA = a.id || 0;
        const valB = b.id || 0;
        return this.sortOrder === 'ASC' ? valA - valB : valB - valA;
      });
    } else if (this.sortField === 'totalAmount') {
      result.sort((a, b) => {
        const valA = a.totalAmount || 0;
        const valB = b.totalAmount || 0;
        return this.sortOrder === 'ASC' ? valA - valB : valB - valA;
      });
    } else if (this.sortField === 'supplier') {
      result.sort((a, b) => {
        const valA = (a.supplier?.name || '').toLowerCase();
        const valB = (b.supplier?.name || '').toLowerCase();
        return this.sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    this.filteredPurchases = result;
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

  get paginatedPurchases(): PurchaseResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPurchases.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openCreateModal(): void {
    this.modalError = null;
    this.purchaseForm.reset({
      supplierId: this.suppliers.length > 0 ? this.suppliers[0].id : null,
      notes: ''
    });
    this.itemRows = [
      { productId: null, quantity: 1, unitCost: 0, subtotal: 0 }
    ];
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalError = null;
  }

  addItemRow(): void {
    this.itemRows.push({ productId: null, quantity: 1, unitCost: 0, subtotal: 0 });
  }

  removeItemRow(index: number): void {
    if (this.itemRows.length > 1) {
      this.itemRows.splice(index, 1);
    }
  }

  onProductSelected(row: ItemRow): void {
    if (!row.productId) return;
    this.calcRow(row);
  }

  calcRow(row: ItemRow): void {
    row.subtotal = (row.quantity || 0) * (row.unitCost || 0);
  }

  get calculatedTotal(): number {
    return this.itemRows.reduce((acc, r) => acc + (r.subtotal || 0), 0);
  }


  openDetailModal(p: PurchaseResponse): void {
    this.selectedPurchase = p;
    this.selectedPurchaseItems = [];
    this.isDetailModalOpen = true;

    if (p.id) {
      this.purchaseService.getPurchaseItemsByPurchaseId(p.id).subscribe({
        next: (res) => {
          if (res?.data) {
            this.selectedPurchaseItems = res.data;
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedPurchase = null;
    this.selectedPurchaseItems = [];
  }

  openStatusModal(p: PurchaseResponse): void {
    this.selectedPurchase = p;
    this.newStatusIdToApply = p.status?.id || null;
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedPurchase = null;
  }

  applyStatusChange(): void {
    if (!this.selectedPurchase?.id || !this.newStatusIdToApply) return;
    this.purchaseService.updatePurchaseStatus(this.selectedPurchase.id, { statusId: this.newStatusIdToApply }).subscribe({
      next: () => {
        this.closeStatusModal();
        this.loadPurchases();
      },
      error: () => {}
    });
  }

  cancelPurchase(p: PurchaseResponse): void {
    if (!p.id) return;
    if (confirm(`¿Está seguro de cancelar la orden de compra #${p.id}?`)) {
      this.purchaseService.cancelPurchase(p.id).subscribe({
        next: () => {
          this.loadPurchases();
        },
        error: () => {}
      });
    }
  }

  formatMoney(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'Q0.00';
    return `Q${amount.toFixed(2)}`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
