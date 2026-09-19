import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { SaleService } from '../../../../core/services/sale';
import { CustomerService } from '../../../../core/services/customer';
import { ProductService } from '../../../../core/services/product';
import { PaymentMethodService } from '../../../../core/services/payment-method';
import { InvoicePdfService } from '../../../../core/services/invoice-pdf';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import {
  SaleResponse,
  SaleRequest,
  SaleItemRequest,
  SaleStatusResponse,
  SaleItemResponse,
  SalePaymentRequest
} from '../../../../core/models/sale';
import { CustomerResponse } from '../../../../core/models/customer';
import { ProductResponse } from '../../../../core/models/product';
import { PaymentMethodResponse } from '../../../../core/models/payment';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';

interface SaleItemRow {
  productId: number | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

@Component({
  selector: 'app-admin-sales',
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
  templateUrl: './sales.html',
  styleUrl: './sales.css'
})
export class Sales implements OnInit {
  private saleService = inject(SaleService);
  private customerService = inject(CustomerService);
  private productService = inject(ProductService);
  private paymentMethodService = inject(PaymentMethodService);
  private invoicePdfService = inject(InvoicePdfService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  sales: SaleResponse[] = [];
  filteredSales: SaleResponse[] = [];
  customers: CustomerResponse[] = [];
  products: ProductResponse[] = [];
  statuses: SaleStatusResponse[] = [];
  paymentMethods: PaymentMethodResponse[] = [];

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
  selectedSale: SaleResponse | null = null;
  selectedSaleItems: SaleItemResponse[] = [];

  isStatusModalOpen = false;
  newStatusIdToApply: number | null = null;

  isPaymentModalOpen = false;
  paymentAmount: number = 0;
  paymentMethodId: number | null = null;
  paymentReference: string = '';

  modalError: string | null = null;

  saleForm: FormGroup = this.fb.group({
    customerId: [null, [Validators.required]],
    paymentMethodId: [null, [Validators.required]],
    paymentReference: ['']
  });

  itemRows: SaleItemRow[] = [];

  ngOnInit(): void {
    this.loadCatalogData();
    this.loadSales();
  }

  loadCatalogData(): void {
    this.customerService.getCustomersSales(0, 200, 'fullName', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) this.customers = res.data.content;
      }
    });

    this.productService.getProducts(0, 300, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) this.products = res.data.content;
      }
    });

    this.saleService.getSaleStatuses().subscribe({
      next: (res) => {
        if (res?.data) this.statuses = res.data;
      }
    });

    this.paymentMethodService.getPaymentMethodsSales(0, 50, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) this.paymentMethods = res.data.content;
      }
    });
  }

  loadSales(): void {
    this.loading = true;
    this.saleService.getSales(0, 500, 'saleDate', 'DESC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.sales = res.data.content;
        } else {
          this.sales = [];
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
    let result = [...this.sales];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(s =>
        (s.customer?.fullName && s.customer.fullName.toLowerCase().includes(term)) ||
        (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(term)) ||
        (s.id && String(s.id).includes(term))
      );
    }

    if (this.selectedStatus !== 'ALL') {
      const sId = Number(this.selectedStatus);
      result = result.filter(s => s.status?.id === sId);
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
    } else if (this.sortField === 'customer') {
      result.sort((a, b) => {
        const valA = (a.customer?.fullName || '').toLowerCase();
        const valB = (b.customer?.fullName || '').toLowerCase();
        return this.sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    this.filteredSales = result;
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

  get paginatedSales(): SaleResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSales.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openCreateModal(): void {
    this.modalError = null;
    this.saleForm.reset({
      customerId: this.customers.length > 0 ? this.customers[0].id : null,
      paymentMethodId: this.paymentMethods.length > 0 ? this.paymentMethods[0].id : null,
      paymentReference: ''
    });
    this.itemRows = [
      { productId: null, quantity: 1, unitPrice: 0, subtotal: 0 }
    ];
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalError = null;
  }

  addItemRow(): void {
    this.itemRows.push({ productId: null, quantity: 1, unitPrice: 0, subtotal: 0 });
  }

  removeItemRow(index: number): void {
    if (this.itemRows.length > 1) {
      this.itemRows.splice(index, 1);
    }
  }

  onProductSelected(row: SaleItemRow): void {
    if (!row.productId) return;
    const prod = this.products.find(p => p.id === row.productId);
    if (prod) {
      row.unitPrice = prod.salePrice || 0;
      this.calcRow(row);
    }
  }

  calcRow(row: SaleItemRow): void {
    row.subtotal = (row.quantity || 0) * (row.unitPrice || 0);
  }

  get calculatedTotal(): number {
    return this.itemRows.reduce((acc, r) => acc + (r.subtotal || 0), 0);
  }

  openDetailModal(s: SaleResponse): void {
    this.selectedSale = s;
    this.selectedSaleItems = [];
    this.isDetailModalOpen = true;

    if (s.id) {
      this.saleService.getSaleItemsBySaleId(s.id).subscribe({
        next: (res) => {
          if (res?.data) {
            this.selectedSaleItems = res.data;
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedSale = null;
    this.selectedSaleItems = [];
  }

  openStatusModal(s: SaleResponse): void {
    this.selectedSale = s;
    this.newStatusIdToApply = s.status?.id || null;
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedSale = null;
  }

  applyStatusChange(): void {
    if (!this.selectedSale?.id || !this.newStatusIdToApply) return;
    this.saleService.updateSaleStatus(this.selectedSale.id, { statusId: this.newStatusIdToApply }).subscribe({
      next: () => {
        this.closeStatusModal();
        this.loadSales();
      },
      error: () => {}
    });
  }

  cancelSale(s: SaleResponse): void {
    if (!s.id) return;
    if (confirm(`¿Está seguro de cancelar la venta ${s.invoiceNumber || '#' + s.id}?`)) {
      this.saleService.cancelSale(s.id).subscribe({
        next: () => {
          this.loadSales();
        },
        error: () => {}
      });
    }
  }

  downloadPdf(s: SaleResponse): void {
    if (!s.id) return;
    this.saleService.getSaleItemsBySaleId(s.id).subscribe({
      next: (res) => {
        s.items = res?.data || [];
        this.invoicePdfService.generateInvoicePdf(s, true);
      },
      error: () => {
        this.invoicePdfService.generateInvoicePdf(s, true);
      }
    });
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
