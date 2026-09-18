import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CategoryService } from '../../../../core/services/category';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import { CategoryResponse, CategoryRequest } from '../../../../core/models/category';

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
  selector: 'app-admin-categories',
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
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  categories: CategoryResponse[] = [];
  filteredCategories: CategoryResponse[] = [];

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
  editingCategoryId: number | null = null;
  modalError: string | null = null;

  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['']
  });

  toast: ToastState | null = null;
  private toastTimeout: any = null;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategoriesAdmin(0, 200, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.categories = res.data.content;
        } else {
          this.categories = [];
        }

        this.categories = this.categories.filter(
          category => category.isActive
        );

        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.categoryService.getCategories(0, 200, 'name', 'ASC').subscribe({
          next: (res) => {
            this.categories = res?.data?.content || [];
            this.applyFilter();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.loading = false;
            this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'Error al cargar categorías.');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  applyFilter(): void {
    let result = [...this.categories];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(c =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
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

    this.filteredCategories = result;
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

  get paginatedCategories(): CategoryResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCategories.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingCategoryId = null;
    this.modalError = null;
    this.categoryForm.reset({ name: '', description: '' });
    this.isModalOpen = true;
  }

  openEditModal(c: CategoryResponse): void {
    this.isEditMode = true;
    this.editingCategoryId = c.id ?? null;
    this.modalError = null;
    this.categoryForm.patchValue({
      name: c.name || '',
      description: c.description || ''
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingCategoryId = null;
    this.modalError = null;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.modalError = null;

    const val = this.categoryForm.value;
    const req: CategoryRequest = {
      name: val.name.trim(),
      description: val.description ? val.description.trim() : undefined
    };

    if (this.isEditMode && this.editingCategoryId) {
      this.categoryService.updateCategory(this.editingCategoryId, req).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showToast('success', 'Categoría Modificada', `La categoría ${req.name} ha sido actualizada.`);
          this.loadCategories();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al actualizar categoría.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.categoryService.createCategory(req).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showToast('success', 'Categoría Creada', `La categoría ${req.name} ha sido creada con éxito.`);
          this.loadCategories();
        },
        error: (err) => {
          this.saving = false;
          this.modalError = extractHttpErrorMessage(err) || 'Error al crear categoría.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteCategory(c: CategoryResponse): void {
    if (!c.id) return;
    if (confirm(`¿Está seguro de eliminar o desactivar la categoría "${c.name}"?`)) {
      this.categoryService.deleteCategory(c.id).subscribe({
        next: () => {
          this.showToast('success', 'Categoría Eliminada', 'La categoría ha sido eliminada.');
          this.loadCategories();
        },
        error: (err) => {
          this.showToast('error', 'Error', extractHttpErrorMessage(err) || 'No se pudo eliminar la categoría.');
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
