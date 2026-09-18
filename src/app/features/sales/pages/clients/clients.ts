import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CustomerService } from '../../../../core/services/customer';
import { SaleService } from '../../../../core/services/sale';
import { InvoicePdfService } from '../../../../core/services/invoice-pdf';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import { CustomerResponse, CustomerRequest } from '../../../../core/models/customer';
import { SaleResponse } from '../../../../core/models/sale';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

@Component({
  selector: 'app-sales-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './clients.html',
  styleUrl: './clients.css'
})
export class Clients implements OnInit, OnDestroy {
  private customerService = inject(CustomerService);
  private saleService = inject(SaleService);
  private invoicePdfService = inject(InvoicePdfService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  customers: CustomerResponse[] = [];
  filteredCustomers: CustomerResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  searchTerm = '';
  taxFilter: string = 'ALL';
  sortField: string = 'fullName';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  loading = true;
  saving = false;
  loadingHistory = false;

  isModalOpen = false;
  isEditMode = false;
  editingCustomerId: number | null = null;
  modalError: string | null = null;

  isHistoryModalOpen = false;
  selectedCustomer: CustomerResponse | null = null;
  customerSales: SaleResponse[] = [];

  customerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    taxNumber: ['CF'],
    phone: [''],
    email: ['', [Validators.email]],
    address: ['']
  });

  toast: ToastState | null = null;
  private toastTimeout: any = null;

  ngOnInit(): void {
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomersSales(0, 1000, 'fullName', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.customers = res.data.content;
        } else {
          this.customers = [];
        }
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        //this.showToast('error', 'Error de carga', extractHttpErrorMessage(err) || 'No se pudo cargar la lista de clientes.');
        this.customers = [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let result = [...this.customers];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(c =>
        (c.fullName && c.fullName.toLowerCase().includes(term)) ||
        (c.taxNumber && c.taxNumber.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.toLowerCase().includes(term)) ||
        (c.address && c.address.toLowerCase().includes(term))
      );
    }

    if (this.taxFilter === 'CF') {
      result = result.filter(c => !c.taxNumber || c.taxNumber.toUpperCase().trim() === 'CF');
    } else if (this.taxFilter === 'NIT') {
      result = result.filter(c => c.taxNumber && c.taxNumber.toUpperCase().trim() !== 'CF');
    }

    if (this.sortField) {
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';
        if (this.sortField === 'fullName') {
          valA = (a.fullName || '').toLowerCase();
          valB = (b.fullName || '').toLowerCase();
        } else if (this.sortField === 'taxNumber') {
          valA = (a.taxNumber || '').toLowerCase();
          valB = (b.taxNumber || '').toLowerCase();
        } else if (this.sortField === 'id') {
          valA = a.id ?? 0;
          valB = b.id ?? 0;
        }
        if (valA < valB) return this.sortOrder === 'ASC' ? -1 : 1;
        if (valA > valB) return this.sortOrder === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    this.filteredCustomers = result;
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

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
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

  get paginatedCustomers(): CustomerResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCustomers.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get totalCount(): number {
    return this.customers.length;
  }

  get cfCount(): number {
    return this.customers.filter(c => !c.taxNumber || c.taxNumber.toUpperCase().trim() === 'CF').length;
  }

  get nitCount(): number {
    return this.customers.filter(c => c.taxNumber && c.taxNumber.toUpperCase().trim() !== 'CF').length;
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingCustomerId = null;
    this.modalError = null;
    this.customerForm.reset({
      fullName: '',
      taxNumber: 'CF',
      phone: '',
      email: '',
      address: ''
    });
    this.isModalOpen = true;
  }

  openEditModal(customer: CustomerResponse): void {
    this.isEditMode = true;
    this.editingCustomerId = customer.id ?? null;
    this.modalError = null;
    this.customerForm.patchValue({
      fullName: customer.fullName || '',
      taxNumber: customer.taxNumber || 'CF',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingCustomerId = null;
    this.modalError = null;
  }

  saveCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.modalError = null;

    const val = this.customerForm.value;
    const req: CustomerRequest = {
      fullName: val.fullName.trim(),
      taxNumber: val.taxNumber ? val.taxNumber.trim() : 'CF',
      phone: val.phone ? val.phone.trim() : undefined,
      email: val.email ? val.email.trim() : undefined,
      address: val.address ? val.address.trim() : undefined
    };

    if (this.isEditMode && this.editingCustomerId) {
      this.customerService.updateCustomer(this.editingCustomerId, req).subscribe({
        next: (res) => {
          this.saving = false;
          this.closeModal();
          //this.showToast('success', 'Cliente Actualizado', `El cliente ${req.fullName} se actualizó correctamente.`);
          this.loadCustomers();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al actualizar el cliente.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.customerService.createCustomer(req).subscribe({
        next: (res) => {
          this.saving = false;
          this.closeModal();
          //this.showToast('success', 'Cliente Registrado', `El cliente ${req.fullName} fue creado con éxito.`);
          this.loadCustomers();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al crear el cliente.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  openHistoryModal(customer: CustomerResponse): void {
    if (!customer.id) return;
    this.selectedCustomer = customer;
    this.customerSales = [];
    this.loadingHistory = true;
    this.isHistoryModalOpen = true;

    this.saleService.getSalesByCustomer(customer.id, 0, 50, 'saleDate', 'DESC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.customerSales = res.data.content;
        } else {
          this.customerSales = [];
        }
        this.loadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingHistory = false;
        //this.showToast('error', 'Historial', extractHttpErrorMessage(err) || 'No se pudieron consultar las ventas del cliente.');
        this.cdr.detectChanges();
      }
    });
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen = false;
    this.selectedCustomer = null;
    this.customerSales = [];
  }

  createSaleForCustomer(customer: CustomerResponse): void {
    this.router.navigate(['/sales/sales'], {
      queryParams: { action: 'new', customerId: customer.id }
    });
  }

  generateInvoicePdf(sale: SaleResponse): void {
    if (!sale.id) return;
    this.saleService.getSaleItemsBySaleId(sale.id).subscribe({
      next: (res) => {
        sale.items = res?.data || [];
        this.invoicePdfService.generateInvoicePdf(sale, true);
        //this.showToast('success', 'PDF Generado', `Factura ${sale.invoiceNumber || '#' + sale.id} descargada.`);
      },
      error: () => {
        this.invoicePdfService.generateInvoicePdf(sale, true);
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
      return d.toLocaleDateString('es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
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
