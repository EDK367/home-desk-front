import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CustomerService } from '../../../../core/services/customer';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import { CustomerResponse } from '../../../../core/models/customer';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './customers.html',
  styleUrl: './customers.css'
})
export class Customers implements OnInit {
  private customerService = inject(CustomerService);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  customers: CustomerResponse[] = [];
  filteredCustomers: CustomerResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  searchTerm = '';
  sortField = 'fullName';
  sortOrder = 'ASC';

  loading = true;
  selectedCustomer: CustomerResponse | null = null;
  isDetailModalOpen = false;

  toast: ToastState | null = null;
  private toastTimeout: any = null;

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomersAdmin(0, 500, 'fullName', 'ASC').subscribe({
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
      error: () => {
        this.customerService.getCustomers(0, 500, 'fullName', 'ASC').subscribe({
          next: (res) => {
            this.customers = res?.data?.content || [];
            this.applyFilter();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.loading = false;
            this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'Error al cargar clientes.');
            this.cdr.detectChanges();
          }
        });
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
        (c.phone && c.phone.toLowerCase().includes(term))
      );
    }

    if (this.sortField === 'fullName') {
      result.sort((a, b) => {
        const valA = (a.fullName || '').toLowerCase();
        const valB = (b.fullName || '').toLowerCase();
        return this.sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    } else if (this.sortField === 'id') {
      result.sort((a, b) => {
        const valA = a.id || 0;
        const valB = b.id || 0;
        return this.sortOrder === 'ASC' ? valA - valB : valB - valA;
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

  get paginatedCustomers(): CustomerResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCustomers.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openDetailModal(c: CustomerResponse): void {
    this.selectedCustomer = c;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedCustomer = null;
  }

  deleteCustomer(c: CustomerResponse): void {
    if (!c.id) return;
    if (confirm(`¿Está seguro de desactivar al cliente "${c.fullName}"?`)) {
      this.customerService.deleteCustomer(c.id).subscribe({
        next: () => {
          this.showToast('success', 'Cliente Desactivado', 'El cliente ha sido desactivado en el sistema.');
          this.loadCustomers();
        },
        error: (err) => {
          this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'Error al desactivar cliente.');
        }
      });
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
