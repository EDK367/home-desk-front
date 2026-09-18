import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SessionService } from '../../../core/services/session';
import { SaleService } from '../../../core/services/sale';
import { CustomerService } from '../../../core/services/customer';
import { InvoicePdfService } from '../../../core/services/invoice-pdf';
import { UserSummaryResponse } from '../../../core/models/auth';
import { SaleResponse } from '../../../core/models/sale';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private sessionService = inject(SessionService);
  private saleService = inject(SaleService);
  private customerService = inject(CustomerService);
  private invoicePdfService = inject(InvoicePdfService);
  private cdr = inject(ChangeDetectorRef);

  user: UserSummaryResponse | null = null;
  totalSales = 0;
  totalRevenue = 0;
  totalCustomers = 0;
  averageTicket = 0;

  loadingStats = true;
  loadingRecent = true;

  recentSales: SaleResponse[] = [];

  ngOnInit(): void {
    this.user = this.sessionService.getUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loadingStats = true;
    this.loadingRecent = true;

    this.saleService.getSales(0, 6, 'saleDate', 'DESC').subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalSales = res.data.totalElements ?? 0;
          this.recentSales = res.data.content || [];

          const sum = this.recentSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
          this.totalRevenue = sum;
          this.averageTicket = this.recentSales.length > 0 ? (sum / this.recentSales.length) : 0;
        }
        this.loadingRecent = false;
        this.checkStatsLoaded();
      },
      error: () => {
        this.loadingRecent = false;
        this.checkStatsLoaded();
      }
    });

    this.customerService.getCustomersSales(0, 1).subscribe({
      next: (res) => {
        if (res?.data) {
          this.totalCustomers = res.data.totalElements ?? 0;
        }
        this.checkStatsLoaded();
      },
      error: () => {
        this.checkStatsLoaded();
      }
    });
  }

  private checkStatsLoaded(): void {
    this.loadingStats = false;
    this.cdr.detectChanges();
  }

  get userFirstName(): string {
    if (!this.user?.fullName) return 'Vendedor';
    return this.user.fullName.trim().split(/\s+/)[0];
  }

  downloadInvoice(sale: SaleResponse): void {
    this.invoicePdfService.generateInvoicePdf(sale, true);
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

  formatCurrency(value?: number): string {
    if (value == null) return 'Q 0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(value).replace('GTQ', 'Q');
  }

  getStatusBadgeClass(statusName?: string): string {
    switch (statusName) {
      case 'COMPLETADA':
      case 'PAGADA':
        return 'badge-completed';
      case 'PENDIENTE':
        return 'badge-pending';
      case 'ENTREGADA':
        return 'badge-delivered';
      case 'CANCELADA':
        return 'badge-cancelled';
      default:
        return 'badge-default';
    }
  }

  getStatusLabel(statusName?: string): string {
    switch (statusName) {
      case 'COMPLETADA':
        return 'Completada';
      case 'PAGADA':
        return 'Pagada';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'ENTREGADA':
        return 'Entregada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return statusName || 'Registrada';
    }
  }
}
