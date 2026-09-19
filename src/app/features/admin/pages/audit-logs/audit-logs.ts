import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuditService } from '../../../../core/services/audit';
import { AuditLogResponse } from '../../../../core/models/audit';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-admin-audit-logs',
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
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css'
})
export class AuditLogs implements OnInit {
  private auditService = inject(AuditService);
  private cdr = inject(ChangeDetectorRef);

  protected readonly Math = Math;

  auditLogs: AuditLogResponse[] = [];

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  sortField = 'createdAt';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  loading = true;

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loading = true;
    this.auditService.getAuditLogs(this.currentPage - 1, this.pageSize, this.sortField, this.sortOrder).subscribe({
      next: (res) => {
        if (res?.data) {
          this.auditLogs = res.data.content || [];
          this.totalElements = res.data.totalElements || 0;
          this.totalPages = Math.max(1, res.data.totalPages || 1);
        } else {
          this.auditLogs = [];
          this.totalElements = 0;
          this.totalPages = 1;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  onSortFieldChange(field: string): void {
    this.sortField = field;
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  onSortOrderChange(order: 'ASC' | 'DESC'): void {
    this.sortOrder = order;
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadAuditLogs();
    }
  }

  get pagesArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatDate(isoDate?: string): string {
    if (!isoDate) return '—';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoDate;
    }
  }

  getActionBadgeClass(action?: string): string {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('INSERT') || act.includes('NUEV')) {
      return 'badge-create';
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIF')) {
      return 'badge-update';
    }
    if (act.includes('DELETE') || act.includes('CANCEL') || act.includes('ELIMIN')) {
      return 'badge-delete';
    }
    return 'badge-default';
  }
}
