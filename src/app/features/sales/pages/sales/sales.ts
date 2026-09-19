import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { SaleService } from '../../../../core/services/sale';
import { CustomerService } from '../../../../core/services/customer';
import { ProductService } from '../../../../core/services/product';
import { InventoryService } from '../../../../core/services/inventory';
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
import { NotificationService } from '../../../../core/services/notification';

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
  availableStock?: number;
}

@Component({
  selector: 'app-sales-list',
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
export class SalesList implements OnInit, OnDestroy {
  private saleService = inject(SaleService);
  private customerService = inject(CustomerService);
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private paymentMethodService = inject(PaymentMethodService);
  private invoicePdfService = inject(InvoicePdfService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);

  private routerSub: Subscription | null = null;

  allSales: SaleResponse[] = [];
  filteredSales: SaleResponse[] = [];
  customers: CustomerResponse[] = [];
  products: ProductResponse[] = [];
  statuses: SaleStatusResponse[] = [];
  paymentMethods: PaymentMethodResponse[] = [];

  productStockMap = new Map<number, number>();

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: string = 'saleDate';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  searchTerm = '';
  selectedStatusFilter: string = 'ALL';
  selectedCustomerFilter: string = 'ALL';

  loading = true;
  saving = false;
  statusUpdating = false;

  isCreateModalOpen = false;
  isDetailModalOpen = false;
  isStatusModalOpen = false;

  selectedSale: SaleResponse | null = null;
  selectedSaleItems: SaleItemResponse[] = [];
  loadingDetailItems = false;

  newStatusIdToApply: number | null = null;
  modalError: string | null = null;

  saleForm: FormGroup = this.fb.group({
    customerId: [null, [Validators.required]],
    saleDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
    invoiceNumber: [''],
    statusId: [null],
    paymentMethodId: [null, [Validators.required]],
    paymentReference: [''],
    paymentNotes: ['']
  });

  itemRows: SaleItemRow[] = [];

  ngOnInit(): void {
    this.loadCatalogData();
    this.loadSales();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        const customerId = params['customerId'] ? Number(params['customerId']) : undefined;
        this.openCreateModal(customerId);
      } else if (params['viewId']) {
        const id = Number(params['viewId']);
        if (id) {
          this.viewSaleById(id);
        }
      }
    });

    let initialNavDone = false;
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.startsWith('/sales/sales')) {
          if (!initialNavDone) {
            initialNavDone = true;
          } else {
            this.loadSales();
          }
        } else {
          initialNavDone = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  loadCatalogData(): void {
    this.saleService.getSaleStatuses().subscribe({
      next: (res) => {
        if (res?.data) {
          this.statuses = res.data;
        } else {
          this.statuses = this.getDefaultStatuses();
        }
      },
      error: () => {
        this.statuses = this.getDefaultStatuses();
      }
    });

    this.customerService.getCustomersSales(0, 100, 'fullName', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.customers = res.data.content;
        }
      }
    });

    this.productService.getProducts(0, 150, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.products = res.data.content;
          this.loadInitialStocks();
        }
      }
    });

    this.paymentMethodService.getPaymentMethodsSales(0, 20).subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.paymentMethods = res.data.content;
        }
      }
    });
  }

  private loadInitialStocks(): void {
    this.inventoryService.getInventories(0, 150).subscribe({
      next: (res) => {
        if (res?.data?.content) {
          res.data.content.forEach(inv => {
            if (inv.product?.id != null) {
              this.productStockMap.set(inv.product.id, inv.quantityOnHand ?? 0);
            }
          });
        }
      }
    });
  }

  private getDefaultStatuses(): SaleStatusResponse[] {
    return [
      { id: 1, name: 'PENDIENTE', description: 'Venta registrada pendiente de pago y entrega' },
      { id: 2, name: 'PAGADA', description: 'Venta pagada pendiente de entrega' },
      { id: 3, name: 'ENTREGADA', description: 'Productos despachados y recibidos por el cliente' },
      { id: 4, name: 'COMPLETADA', description: 'Venta finalizada exitosamente con cobro y entrega conformes' },
      { id: 5, name: 'CANCELADA', description: 'Venta anulada con reversión de inventario' }
    ];
  }

  loadSales(): void {
    const pageIndex = Math.max(0, this.currentPage - 1);
    this.loading = true;

    if (this.selectedStatusFilter !== 'ALL') {
      const stId = Number(this.selectedStatusFilter);
      this.saleService.getSalesByStatus(stId, pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
        next: (res) => this.handleSalesResponse(res, pageIndex),
        error: () => this.handleSalesError()
      });
    } else if (this.selectedCustomerFilter !== 'ALL') {
      const custId = Number(this.selectedCustomerFilter);
      this.saleService.getSalesByCustomer(custId, pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
        next: (res) => this.handleSalesResponse(res, pageIndex),
        error: () => this.handleSalesError()
      });
    } else {
      this.saleService.getSales(pageIndex, this.pageSize, this.sortField, this.sortOrder).subscribe({
        next: (res) => this.handleSalesResponse(res, pageIndex),
        error: () => this.handleSalesError()
      });
    }
  }

  private handleSalesResponse(res: any, pageIndex: number): void {
    if (res?.data) {
      const content = res.data.content || [];
      this.allSales = content;
      this.totalElements = res.data.totalElements ?? content.length;
      this.totalPages = Math.max(1, res.data.totalPages ?? 1);
      const pageNum = (res.data as any).number ?? res.data.pageNumber ?? pageIndex;
      this.currentPage = pageNum + 1;
      this.applyFilter();
    } else {
      this.allSales = [];
      this.filteredSales = [];
      this.totalElements = 0;
      this.totalPages = 1;
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  private handleSalesError(): void {
    this.allSales = [];
    this.filteredSales = [];
    this.totalElements = 0;
    this.totalPages = 1;
    this.loading = false;
    this.cdr.detectChanges();
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
    this.loadSales();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.loadSales();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadSales();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadSales();
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  onStatusFilterChange(statusId: string): void {
    this.selectedStatusFilter = statusId;
    this.currentPage = 1;
    this.loadSales();
  }

  onCustomerFilterChange(customerId: string): void {
    this.selectedCustomerFilter = customerId;
    this.currentPage = 1;
    this.loadSales();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredSales = [...this.allSales];
      return;
    }

    this.filteredSales = this.allSales.filter(sale => {
      const invMatch = sale.invoiceNumber?.toLowerCase().includes(term) ?? false;
      const custMatch = sale.customer?.fullName?.toLowerCase().includes(term) ?? false;
      const taxMatch = sale.customer?.taxNumber?.toLowerCase().includes(term) ?? false;
      const userMatch = sale.user?.fullName?.toLowerCase().includes(term) ?? false;
      const statusMatch = sale.status?.name?.toLowerCase().includes(term) ?? false;
      const idMatch = sale.id?.toString().includes(term) ?? false;
      return invMatch || custMatch || taxMatch || userMatch || statusMatch || idMatch;
    });
  }

  openCreateModal(prefillCustomerId?: number): void {
    this.modalError = null;
    this.saleForm.reset({
      customerId: prefillCustomerId || null,
      saleDate: new Date().toISOString().substring(0, 10),
      invoiceNumber: '',
      statusId: this.getDefaultStatusId(),
      paymentMethodId: this.paymentMethods.length > 0 ? this.paymentMethods[0].id : null,
      paymentReference: '',
      paymentNotes: ''
    });

    this.itemRows = [];
    this.addItem();
    this.isCreateModalOpen = true;
  }

  private getDefaultStatusId(): number | null {
    const compStatus = this.statuses.find(s => s.name === 'COMPLETADA');

    if (compStatus?.id) return compStatus.id;

    return 1;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.modalError = null;
    this.itemRows = [];
    this.saleForm.reset();

    if (this.route.snapshot.queryParams['action']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { action: null, customerId: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  addItem(productId?: number): void {
    const newItem: SaleItemRow = {
      productId: productId || null,
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      availableStock: 0
    };

    if (productId) {
      const prod = this.products.find(p => p.id === productId);
      if (prod) {
        newItem.unitPrice = Number(prod.salePrice) || 0;
        newItem.subtotal = newItem.unitPrice;
        newItem.availableStock = this.productStockMap.get(productId) ?? 0;
      }
    }

    this.itemRows.push(newItem);
  }

  removeItem(index: number): void {
    if (this.itemRows.length > 1) {
      this.itemRows.splice(index, 1);
    } else {
      this.notificationService.showError('La venta debe contener al menos un producto.', 'Validación');
    }
  }

  onProductSelected(index: number): void {
    const item = this.itemRows[index];
    if (!item.productId) return;

    const prod = this.products.find(p => p.id === item.productId);
    if (prod) {
      item.unitPrice = Number(prod.salePrice) || 0;
      item.availableStock = this.productStockMap.get(item.productId) ?? 0;
      this.updateItemSubtotal(index);
    }
  }

  updateItemSubtotal(index: number): void {
    const item = this.itemRows[index];
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    item.quantity = qty;
    item.unitPrice = price;
    item.subtotal = +(qty * price).toFixed(2);
  }

  getStockForProduct(productId: number | null): number {
    if (!productId) return 0;
    return this.productStockMap.get(productId) ?? 0;
  }

  get calculatedSubtotal(): number {
    return this.itemRows.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  }

  get calculatedTax(): number {
    return +(this.calculatedSubtotal * 0.12).toFixed(2);
  }

  get calculatedTotal(): number {
    return +(this.calculatedSubtotal + this.calculatedTax).toFixed(2);
  }

  saveSale(): void {
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      return;
    }

    if (this.itemRows.length === 0) {
      this.modalError = 'Debe agregar al menos un producto a la venta.';
      return;
    }

    const productIds = new Set<number>();
    const itemsPayload: SaleItemRequest[] = [];

    for (let i = 0; i < this.itemRows.length; i++) {
      const it = this.itemRows[i];
      if (!it.productId) {
        this.modalError = `Fila #${i + 1}: Seleccione un producto válido.`;
        return;
      }
      if (productIds.has(it.productId)) {
        const prod = this.products.find(p => p.id === it.productId);
        this.modalError = `El producto "${prod?.name || it.productId}" se encuentra repetido en la factura.`;
        return;
      }
      productIds.add(it.productId);

      const available = this.productStockMap.get(it.productId) ?? 0;
      if (it.quantity > available) {
        const prod = this.products.find(p => p.id === it.productId);
        this.modalError = `Stock insuficiente para "${prod?.name}". Solicitado: ${it.quantity}, disponible en bodega: ${available}.`;
        return;
      }

      if (!it.quantity || it.quantity < 1) {
        this.modalError = `Fila #${i + 1}: La cantidad debe ser mayor a 0.`;
        return;
      }

      itemsPayload.push({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice
      });
    }

    const formVal = this.saleForm.value;
    let saleDateIso: string | undefined = undefined;
    if (formVal.saleDate) {
      const d = new Date(formVal.saleDate + 'T12:00:00Z');
      saleDateIso = d.toISOString();
    }

    const paymentsPayload: SalePaymentRequest[] = [];
    if (formVal.paymentMethodId) {
      paymentsPayload.push({
        paymentMethodId: Number(formVal.paymentMethodId),
        amount: this.calculatedTotal,
        paymentDate: saleDateIso,
        referenceNumber: formVal.paymentReference ? formVal.paymentReference.trim() : undefined,
        notes: formVal.paymentNotes ? formVal.paymentNotes.trim() : undefined
      });
    }

    const payload: SaleRequest = {
      customerId: Number(formVal.customerId),
      invoiceNumber: formVal.invoiceNumber ? formVal.invoiceNumber.trim() : undefined,
      statusId: formVal.statusId ? Number(formVal.statusId) : undefined,
      saleDate: saleDateIso,
      items: itemsPayload,
      payments: paymentsPayload.length > 0 ? paymentsPayload : undefined
    };

    this.saving = true;
    this.modalError = null;

    this.saleService.createSale(payload).subscribe({
      next: (res) => {
        this.saving = false;
        const createdSale = res.data;
        this.closeCreateModal();

        if (createdSale) {
          this.invoicePdfService.generateInvoicePdf(createdSale, true);
        }

        this.currentPage = 1;
        this.loadSales();
        this.loadInitialStocks();
      },
      error: (err) => {
        this.saving = false;
        this.modalError = extractHttpErrorMessage(err) || 'Error al procesar la venta en el servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  openDetailModal(sale: SaleResponse): void {
    this.selectedSale = sale;
    this.selectedSaleItems = sale.items || [];
    this.isDetailModalOpen = true;

    if (!sale.items || sale.items.length === 0) {
      this.loadDetailItems(sale.id!);
    }
  }

  viewSaleById(id: number): void {
    this.saleService.getSaleById(id).subscribe({
      next: (res) => {
        if (res?.data) {
          this.openDetailModal(res.data);
        }
      }
    });
  }

  loadDetailItems(saleId: number): void {
    this.loadingDetailItems = true;
    this.saleService.getSaleItemsBySaleId(saleId).subscribe({
      next: (res) => {
        if (res?.data) {
          this.selectedSaleItems = res.data;
        }
        this.loadingDetailItems = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingDetailItems = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedSale = null;
    this.selectedSaleItems = [];

    if (this.route.snapshot.queryParams['viewId']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { viewId: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  downloadInvoicePdf(sale: SaleResponse): void {
    this.invoicePdfService.generateInvoicePdf(sale, true);
  }

  openStatusModal(sale: SaleResponse): void {
    if (sale.status?.name === 'CANCELADA') {
      this.notificationService.showError('No se puede modificar el estado de una venta cancelada.', 'Aviso');
      return;
    }
    this.selectedSale = sale;
    this.newStatusIdToApply = null;
    this.modalError = null;
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedSale = null;
    this.newStatusIdToApply = null;
    this.modalError = null;
  }

  saveStatusChange(): void {
    if (!this.selectedSale?.id || !this.newStatusIdToApply) {
      this.modalError = 'Debe seleccionar un nuevo estado.';
      return;
    }

    if (this.selectedSale.status?.id === this.newStatusIdToApply) {
      this.modalError = 'La venta ya se encuentra en el estado indicado.';
      return;
    }

    this.statusUpdating = true;
    this.modalError = null;

    this.saleService.updateSaleStatus(this.selectedSale.id, { statusId: this.newStatusIdToApply }).subscribe({
      next: (res) => {
        this.statusUpdating = false;
        this.closeStatusModal();
        if (this.isDetailModalOpen && res.data) {
          this.selectedSale = res.data;
        }
        this.loadSales();
        this.loadInitialStocks();
      },
      error: (err) => {
        this.statusUpdating = false;
        this.modalError = extractHttpErrorMessage(err) || 'Error al actualizar el estado de la venta.';
        this.cdr.detectChanges();
      }
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
