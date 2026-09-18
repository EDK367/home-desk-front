import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { PurchaseService } from '../../../../core/services/purchase';
import { SupplierService } from '../../../../core/services/supplier';
import { ProductService } from '../../../../core/services/product';
import { SupplierProductService } from '../../../../core/services/supplier-product';
import { extractHttpErrorMessage } from '../../../../core/interceptors/error.interceptor';
import {
  PurchaseResponse,
  PurchaseRequest,
  PurchaseItemRequest,
  PurchaseStatusResponse,
  PurchaseItemResponse
} from '../../../../core/models/purchase';
import { SupplierResponse, SupplierProductResponse } from '../../../../core/models/supplier';
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

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface PurchaseItemRow {
  productId: number | null;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

@Component({
  selector: 'app-purchases',
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
export class Purchases implements OnInit, OnDestroy {
  private purchaseService = inject(PurchaseService);
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);
  private supplierProductService = inject(SupplierProductService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private routerSub: Subscription | null = null;

  allPurchases: PurchaseResponse[] = [];
  filteredPurchases: PurchaseResponse[] = [];
  suppliers: SupplierResponse[] = [];
  products: ProductResponse[] = [];
  statuses: PurchaseStatusResponse[] = [];
  supplierProductsMap = new Map<number, SupplierProductResponse[]>();

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  sortField: string = 'purchaseDate';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  searchTerm = '';
  selectedStatusFilter: string = 'ALL';
  selectedSupplierFilter: string = 'ALL';

  loading = true;
  saving = false;
  statusUpdating = false;

  isCreateModalOpen = false;
  isDetailModalOpen = false;
  isStatusModalOpen = false;

  selectedPurchase: PurchaseResponse | null = null;
  selectedPurchaseItems: PurchaseItemResponse[] = [];
  loadingDetailItems = false;

  newStatusIdToApply: number | null = null;
  modalError: string | null = null;

  purchaseForm: FormGroup = this.fb.group({
    supplierId: [null, [Validators.required]],
    statusId: [null],
    purchaseDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
    notes: ['', [Validators.maxLength(255)]]
  });

  itemRows: PurchaseItemRow[] = [];

  toast: ToastState | null = null;
  private toastTimeout: any = null;

  ngOnInit(): void {
    this.loadCatalogData();
    this.loadPurchases();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        const supplierId = params['supplierId'] ? Number(params['supplierId']) : undefined;
        const productId = params['productId'] ? Number(params['productId']) : undefined;
        this.openCreateModal(supplierId, productId);
      } else if (params['viewId']) {
        const id = Number(params['viewId']);
        if (id) {
          this.viewPurchaseById(id);
        }
      }
    });

    let initialNavDone = false;
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url: string = event.urlAfterRedirects || event.url || '';
        if (url.startsWith('/purchasing/purchases')) {
          if (!initialNavDone) {
            initialNavDone = true;
          } else {
            this.loadPurchases();
          }
        } else {
          initialNavDone = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  loadCatalogData(): void {
    this.purchaseService.getPurchaseStatuses().subscribe({
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

    this.supplierService.getSuppliers(0, 100, 'name', 'ASC', false).subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.suppliers = res.data.content;
        }
      }
    });

    this.productService.getProducts(0, 150, 'name', 'ASC').subscribe({
      next: (res) => {
        if (res?.data?.content) {
          this.products = res.data.content;
        }
      }
    });
  }

  private getDefaultStatuses(): PurchaseStatusResponse[] {
    return [
      { id: 1, name: 'SOLICITADA', description: 'Orden de compra solicitada' },
      { id: 2, name: 'APROBADA', description: 'Orden de compra autorizada' },
      { id: 3, name: 'EN_TRANSITO', description: 'Mercadería despachada en tránsito' },
      { id: 4, name: 'RECIBIDA', description: 'Mercadería recibida en bodega' },
      { id: 5, name: 'CANCELADA', description: 'Orden de compra anulada' }
    ];
  }

  loadPurchases(): void {
    const pageIndex = Math.max(0, this.currentPage - 1);

    const cached = this.purchaseService.getCachedPurchases(
      pageIndex,
      this.pageSize,
      this.sortField,
      this.sortOrder
    );

    if (cached && cached.content && cached.content.length > 0) {
      this.allPurchases = cached.content;
      this.totalElements = cached.totalElements ?? cached.content.length;
      this.totalPages = Math.max(1, cached.totalPages ?? 1);
      const pageNum = (cached as any).number ?? cached.pageNumber ?? pageIndex;
      this.currentPage = pageNum + 1;
      this.loading = false;
      this.applyFilter();
    } else {
      this.loading = true;
    }

    this.purchaseService
      .getPurchases(pageIndex, this.pageSize, this.sortField, this.sortOrder)
      .subscribe({
        next: (res) => {
          if (res?.data) {
            const content = res.data.content || [];
            this.allPurchases = content;
            this.totalElements = res.data.totalElements ?? content.length;
            this.totalPages = Math.max(1, res.data.totalPages ?? 1);
            const pageNum = (res.data as any).number ?? res.data.pageNumber ?? pageIndex;
            this.currentPage = pageNum + 1;
            this.applyFilter();
          } else {
            this.allPurchases = [];
            this.filteredPurchases = [];
            this.totalElements = 0;
            this.totalPages = 1;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al consultar compras:', err);
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
    this.loadPurchases();
  }

  onSortOrderChange(newOrder: 'ASC' | 'DESC'): void {
    this.sortOrder = newOrder;
    this.currentPage = 1;
    this.loadPurchases();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadPurchases();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadPurchases();
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatusFilter = status;
    this.applyFilter();
  }

  onSupplierFilterChange(supplierId: string): void {
    this.selectedSupplierFilter = supplierId;
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredPurchases = this.allPurchases.filter(purchase => {
      if (this.selectedStatusFilter !== 'ALL') {
        if (purchase.status?.name !== this.selectedStatusFilter) {
          return false;
        }
      }

      if (this.selectedSupplierFilter !== 'ALL') {
        const supId = Number(this.selectedSupplierFilter);
        if (purchase.supplier?.id !== supId) {
          return false;
        }
      }

      if (!term) return true;

      const idMatch = purchase.id?.toString().includes(term) ?? false;
      const supplierMatch = purchase.supplier?.name?.toLowerCase().includes(term) ?? false;
      const taxMatch = purchase.supplier?.taxNumber?.toLowerCase().includes(term) ?? false;
      const notesMatch = purchase.notes?.toLowerCase().includes(term) ?? false;
      const userMatch = purchase.user?.fullName?.toLowerCase().includes(term) ?? false;
      const statusMatch = purchase.status?.name?.toLowerCase().includes(term) ?? false;

      return idMatch || supplierMatch || taxMatch || notesMatch || userMatch || statusMatch;
    });
  }

  openCreateModal(prefillSupplierId?: number, prefillProductId?: number): void {
    this.modalError = null;
    this.purchaseForm.reset({
      supplierId: prefillSupplierId || null,
      statusId: this.getDefaultStatusId(),
      purchaseDate: new Date().toISOString().substring(0, 10),
      notes: ''
    });

    this.itemRows = [];
    this.addItem(prefillProductId);

    if (prefillSupplierId) {
      this.onSupplierSelected(prefillSupplierId);
    }

    this.isCreateModalOpen = true;
  }

  private getDefaultStatusId(): number | null {
    const recStatus = this.statuses.find(s => s.name === 'RECIBIDA');
    if (recStatus?.id) return recStatus.id;
    const solStatus = this.statuses.find(s => s.name === 'SOLICITADA');
    return solStatus?.id || (this.statuses.length > 0 ? this.statuses[0].id || null : null);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.modalError = null;
    this.itemRows = [];
    this.purchaseForm.reset();

    if (this.route.snapshot.queryParams['action']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { action: null, supplierId: null, productId: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  onSupplierSelected(supplierId: number): void {
    if (!supplierId) return;

    if (!this.supplierProductsMap.has(supplierId)) {
      this.supplierProductService.getProductsBySupplier(supplierId, 0, 50).subscribe({
        next: (res) => {
          if (res?.data?.content) {
            this.supplierProductsMap.set(supplierId, res.data.content);
            this.syncItemPricesWithSupplierProducts(supplierId);
          }
        }
      });
    } else {
      this.syncItemPricesWithSupplierProducts(supplierId);
    }
  }

  private syncItemPricesWithSupplierProducts(supplierId: number): void {
    const list = this.supplierProductsMap.get(supplierId) || [];
    this.itemRows.forEach(item => {
      if (item.productId) {
        const match = list.find(sp => sp.product?.id === item.productId);
        if (match && match.cost != null && match.cost > 0 && item.unitCost === 0) {
          item.unitCost = Number(match.cost);
          item.subtotal = +(item.quantity * item.unitCost).toFixed(2);
        }
      }
    });
  }

  addItem(productId?: number, unitCost?: number): void {
    const newItem: PurchaseItemRow = {
      productId: productId || null,
      quantity: 1,
      unitCost: unitCost || 0,
      subtotal: unitCost ? +(unitCost).toFixed(2) : 0
    };

    if (productId && this.purchaseForm.value.supplierId) {
      const supProducts = this.supplierProductsMap.get(this.purchaseForm.value.supplierId);
      const match = supProducts?.find(sp => sp.product?.id === productId);
      if (match && match.cost != null) {
        newItem.unitCost = Number(match.cost);
        newItem.subtotal = +(newItem.quantity * newItem.unitCost).toFixed(2);
      }
    }

    this.itemRows.push(newItem);
  }

  removeItem(index: number): void {
    if (this.itemRows.length > 1) {
      this.itemRows.splice(index, 1);
    } else {
      this.showToast('error', 'Validación', 'La compra debe tener al menos un producto.');
    }
  }

  onProductSelected(index: number): void {
    const item = this.itemRows[index];
    if (!item.productId) return;

    const supplierId = this.purchaseForm.value.supplierId;
    if (supplierId && this.supplierProductsMap.has(supplierId)) {
      const supProducts = this.supplierProductsMap.get(supplierId);
      const match = supProducts?.find(sp => sp.product?.id === item.productId);
      if (match && match.cost != null) {
        item.unitCost = Number(match.cost);
        this.updateItemSubtotal(index);
        return;
      }
    }

    this.updateItemSubtotal(index);
  }

  updateItemSubtotal(index: number): void {
    const item = this.itemRows[index];
    const qty = Math.max(1, Number(item.quantity) || 1);
    const cost = Math.max(0, Number(item.unitCost) || 0);
    item.quantity = qty;
    item.unitCost = cost;
    item.subtotal = +(qty * cost).toFixed(2);
  }

  get calculatedSubtotal(): number {
    return this.itemRows.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  }

  get calculatedTax(): number {
    // 12% IVA Guatemala
    return +(this.calculatedSubtotal * 0.12).toFixed(2);
  }

  get calculatedTotal(): number {
    return +(this.calculatedSubtotal + this.calculatedTax).toFixed(2);
  }

  savePurchase(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    if (this.itemRows.length === 0) {
      this.modalError = 'Debe agregar al menos un producto a la compra.';
      return;
    }

    const productIds = new Set<number>();
    const itemsPayload: PurchaseItemRequest[] = [];

    for (let i = 0; i < this.itemRows.length; i++) {
      const it = this.itemRows[i];
      if (!it.productId) {
        this.modalError = `Fila #${i + 1}: Seleccione un producto válido.`;
        return;
      }
      if (productIds.has(it.productId)) {
        const prod = this.products.find(p => p.id === it.productId);
        this.modalError = `El producto "${prod?.name || it.productId}" se encuentra duplicado en la orden.`;
        return;
      }
      productIds.add(it.productId);

      if (!it.quantity || it.quantity < 1) {
        this.modalError = `Fila #${i + 1}: La cantidad debe ser de al menos 1 unidad.`;
        return;
      }

      if (!it.unitCost || it.unitCost <= 0) {
        this.modalError = `Fila #${i + 1}: El costo unitario debe ser mayor a 0.`;
        return;
      }

      itemsPayload.push({
        productId: it.productId,
        quantity: it.quantity,
        unitCost: it.unitCost
      });
    }

    const formVal = this.purchaseForm.value;
    let purchaseDateIso: string | undefined = undefined;
    if (formVal.purchaseDate) {
      const d = new Date(formVal.purchaseDate + 'T12:00:00Z');
      purchaseDateIso = d.toISOString();
    }

    const payload: PurchaseRequest = {
      supplierId: Number(formVal.supplierId),
      statusId: formVal.statusId ? Number(formVal.statusId) : undefined,
      purchaseDate: purchaseDateIso,
      notes: formVal.notes ? formVal.notes.trim() : undefined,
      items: itemsPayload
    };

    this.saving = true;
    this.modalError = null;

    this.purchaseService.createPurchase(payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.closeCreateModal();
        this.showToast('success', 'Compra Registrada', `La orden de compra #${res.data?.id || ''} fue creada exitosamente.`);
        this.currentPage = 1;
        this.loadPurchases();
      },
      error: (err) => {
        this.saving = false;
        this.modalError = extractHttpErrorMessage(err) || 'Error al registrar la compra en el servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  openDetailModal(purchase: PurchaseResponse): void {
    this.selectedPurchase = purchase;
    this.selectedPurchaseItems = purchase.items || [];
    this.isDetailModalOpen = true;

    if (!purchase.items || purchase.items.length === 0) {
      this.loadDetailItems(purchase.id!);
    }
  }

  viewPurchaseById(id: number): void {
    this.purchaseService.getPurchaseById(id).subscribe({
      next: (res) => {
        if (res?.data) {
          this.openDetailModal(res.data);
        }
      }
    });
  }

  loadDetailItems(purchaseId: number): void {
    this.loadingDetailItems = true;
    this.purchaseService.getPurchaseItemsByPurchaseId(purchaseId).subscribe({
      next: (res) => {
        if (res?.data) {
          this.selectedPurchaseItems = res.data;
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
    this.selectedPurchase = null;
    this.selectedPurchaseItems = [];

    if (this.route.snapshot.queryParams['viewId']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { viewId: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  openStatusModal(purchase: PurchaseResponse): void {
    if (purchase.status?.name === 'CANCELADA') {
      this.showToast('error', 'Acción no permitida', 'No se puede modificar el estado de una orden cancelada.');
      return;
    }
    this.selectedPurchase = purchase;
    this.newStatusIdToApply = null;
    this.modalError = null;
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedPurchase = null;
    this.newStatusIdToApply = null;
    this.modalError = null;
  }

  saveStatusChange(): void {
    if (!this.selectedPurchase?.id || !this.newStatusIdToApply) {
      this.modalError = 'Debe seleccionar un nuevo estado.';
      return;
    }

    if (this.selectedPurchase.status?.id === this.newStatusIdToApply) {
      this.modalError = 'La compra ya se encuentra en el estado seleccionado.';
      return;
    }

    this.statusUpdating = true;
    this.modalError = null;

    this.purchaseService.updatePurchaseStatus(this.selectedPurchase.id, { statusId: this.newStatusIdToApply }).subscribe({
      next: (res) => {
        this.statusUpdating = false;
        const updatedStatus = res.data?.status?.name || 'actualizado';
        this.showToast('success', 'Estado Actualizado', `La orden #${this.selectedPurchase?.id} ahora está en estado: ${updatedStatus}.`);
        this.closeStatusModal();
        if (this.isDetailModalOpen && res.data) {
          this.selectedPurchase = res.data;
        }
        this.loadPurchases();
      },
      error: (err) => {
        this.statusUpdating = false;
        this.modalError = extractHttpErrorMessage(err) || 'Error al cambiar el estado de la compra.';
        this.cdr.detectChanges();
      }
    });
  }

  cancelPurchase(purchase: PurchaseResponse): void {
    if (!purchase.id) return;

    if (purchase.status?.name === 'CANCELADA') {
      this.showToast('error', 'Aviso', 'Esta compra ya se encuentra cancelada.');
      return;
    }

    const confirmMsg = `¿Está seguro de anular la orden de compra #${purchase.id} por valor de ${this.formatCurrency(purchase.totalAmount)}?\n\nEsta acción revertirá existencias si la mercadería ya había sido recibida.`;

    if (confirm(confirmMsg)) {
      this.purchaseService.cancelPurchase(purchase.id).subscribe({
        next: () => {
          this.showToast('success', 'Compra Anulada', `La orden #${purchase.id} ha sido cancelada satisfactoriamente.`);
          if (this.isDetailModalOpen) {
            this.closeDetailModal();
          }
          this.loadPurchases();
        },
        error: (err) => {
          const msg = extractHttpErrorMessage(err);
          this.showToast('error', 'No se pudo cancelar', msg);
        }
      });
    }
  }

  showToast(type: 'success' | 'error', title: string, message: string): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast = { show: true, type, title, message };
    this.toastTimeout = setTimeout(() => this.closeToast(), 4500);
  }

  closeToast(): void {
    if (this.toast) {
      this.toast.show = false;
      this.toast = null;
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

  formatDate(isoDate?: string): string {
    if (!isoDate) return '—';
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

  getStatusBadgeClass(statusName?: string): string {
    switch (statusName) {
      case 'RECIBIDA':
        return 'badge-recibida';
      case 'APROBADA':
        return 'badge-aprobada';
      case 'EN_TRANSITO':
        return 'badge-transito';
      case 'SOLICITADA':
        return 'badge-solicitada';
      case 'CANCELADA':
        return 'badge-cancelada';
      default:
        return 'badge-default';
    }
  }

  getStatusLabel(statusName?: string): string {
    switch (statusName) {
      case 'RECIBIDA':
        return 'Recibida en bodega';
      case 'APROBADA':
        return 'Aprobada';
      case 'EN_TRANSITO':
        return 'En tránsito';
      case 'SOLICITADA':
        return 'Solicitada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return statusName || 'Desconocido';
    }
  }

  getStatusDescription(statusName?: string): string {
    switch (statusName) {
      case 'SOLICITADA':
        return 'Orden solicitada pendiente de confirmación formal con el proveedor.';
      case 'APROBADA':
        return 'Orden aprobada y emitida al proveedor para preparación.';
      case 'EN_TRANSITO':
        return 'Mercadería en camino hacia la bodega central de HomeDesk.';
      case 'RECIBIDA':
        return 'Mercadería inspeccionada y recepcionada. Ingresa existencias al inventario automáticamente.';
      case 'CANCELADA':
        return 'Orden anulada. Se revertirán lotes si no han sido consumidos.';
      default:
        return '';
    }
  }
}
