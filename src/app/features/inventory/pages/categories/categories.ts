import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CategoryService } from '../../../../core/services/category';
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
  selector: 'app-inventory-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories implements OnInit {
  private categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef);

  allCategories: CategoryResponse[] = [];
  filteredCategories: CategoryResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: string = 'name';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  searchTerm = '';
  loading = true;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    const pageIndex = Math.max(0, this.currentPage - 1);
    this.loading = true;

    this.categoryService.getCategories(pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
      next: (res) => {
        if (res?.data) {
          const content = res.data.content || [];
          this.allCategories = content;
          this.totalElements = res.data.totalElements ?? content.length;
          this.totalPages = Math.max(1, res.data.totalPages ?? 1);
          const pageNum = (res.data as any).number ?? res.data.pageNumber ?? pageIndex;
          this.currentPage = pageNum + 1;
          this.applyFilter();
        } else {
          this.allCategories = [];
          this.filteredCategories = [];
          this.totalElements = 0;
          this.totalPages = 1;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.allCategories = [];
        this.filteredCategories = [];
        this.totalElements = 0;
        this.totalPages = 1;
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
    this.loadCategories();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.loadCategories();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadCategories();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadCategories();
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
      this.filteredCategories = [...this.allCategories];
      return;
    }

    this.filteredCategories = this.allCategories.filter(c => {
      const nameMatch = c.name?.toLowerCase().includes(term) ?? false;
      const descMatch = c.description?.toLowerCase().includes(term) ?? false;
      const idMatch = c.id?.toString().includes(term) ?? false;
      return nameMatch || descMatch || idMatch;
    });
  }

  formatDate(isoDate?: string): string {
    if (!isoDate) return '-';
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
}
