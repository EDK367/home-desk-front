import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PaymentMethodService } from '../../../../core/services/payment-method';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import { PaymentMethodResponse, PaymentMethodRequest } from '../../../../core/models/payment';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-admin-payment-methods',
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
    MatSelectModule
  ],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.css'
})
export class PaymentMethods implements OnInit {
  private paymentMethodService = inject(PaymentMethodService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  paymentMethods: PaymentMethodResponse[] = [];
  filteredMethods: PaymentMethodResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  searchTerm = '';
  sortField = 'name';
  sortOrder = 'ASC';

  loading = true;
  saving = false;

  isModalOpen = false;
  isEditMode = false;
  editingMethodId: number | null = null;
  modalError: string | null = null;

  methodForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['']
  });

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.loading = true;
    this.paymentMethodService.getPaymentMethodsAdmin(0, 100, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.paymentMethods = res.data.content;
        } else {
          this.paymentMethods = [];
        }
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.paymentMethodService.getPaymentMethodsSales(0, 100, 'name', 'ASC').subscribe({
          next: (res) => {
            this.paymentMethods = res?.data?.content || [];
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
    });
  }

  applyFilter(): void {
    let result = [...this.paymentMethods];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(m =>
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.description && m.description.toLowerCase().includes(term))
      );
    }

    if (this.sortField === 'name') {
      result.sort((a, b) => {
        const valA = (a.name || '').toLowerCase();
        const valB = (b.name || '').toLowerCase();
        return this.sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    } else if (this.sortField === 'id') {
      result.sort((a, b) => {
        const valA = a.id || 0;
        const valB = b.id || 0;
        return this.sortOrder === 'ASC' ? valA - valB : valB - valA;
      });
    }

    this.filteredMethods = result;
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

  get paginatedMethods(): PaymentMethodResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMethods.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingMethodId = null;
    this.modalError = null;
    this.methodForm.reset({ name: '', description: '' });
    this.isModalOpen = true;
  }

  openEditModal(m: PaymentMethodResponse): void {
    this.isEditMode = true;
    this.editingMethodId = m.id ?? null;
    this.modalError = null;
    this.methodForm.patchValue({
      name: m.name || '',
      description: m.description || ''
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingMethodId = null;
    this.modalError = null;
  }

  savePaymentMethod(): void {
    if (this.methodForm.invalid) {
      this.methodForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.modalError = null;

    const val = this.methodForm.value;
    const req: PaymentMethodRequest = {
      name: val.name.trim(),
      description: val.description ? val.description.trim() : undefined
    };

    if (this.isEditMode && this.editingMethodId) {
      this.paymentMethodService.updatePaymentMethod(this.editingMethodId, req).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadPaymentMethods();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al actualizar método de pago.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.paymentMethodService.createPaymentMethod(req).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadPaymentMethods();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al crear método de pago.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  deletePaymentMethod(m: PaymentMethodResponse): void {
    if (!m.id) return;
    if (confirm(`¿Está seguro de desactivar el método de pago "${m.name}"?`)) {
      this.paymentMethodService.deletePaymentMethod(m.id).subscribe({
        next: () => {
          this.loadPaymentMethods();
        },
        error: () => {}
      });
    }
  }
}
