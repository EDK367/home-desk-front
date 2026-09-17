import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from './api';
import {
  PurchaseRequest,
  PurchaseResponse,
  PurchaseStatusResponse,
  PurchaseStatusChangeRequest,
  PurchaseItemResponse
} from '../models/purchase';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService extends ApiService {
  private cache = new Map<string, PageResponse<PurchaseResponse>>();
  private lastLoadedResponse: PageResponse<PurchaseResponse> | null = null;

  getCachedPurchases(
    page: number,
    size: number,
    sortField: string,
    sortOrder: string
  ): PageResponse<PurchaseResponse> | null {
    const key = `${page}_${size}_${sortField}_${sortOrder}`;
    return this.cache.get(key) || this.lastLoadedResponse || null;
  }

  clearCache(): void {
    this.cache.clear();
    this.lastLoadedResponse = null;
  }

  getPurchases(
    page: number = 0,
    size: number = 10,
    sortField: string = 'purchaseDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<PurchaseResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    const key = `${page}_${size}_${sortField}_${sortOrder}`;

    return this.get<PageResponse<PurchaseResponse>>('/purchases', params).pipe(
      tap(res => {
        if (res?.data) {
          this.cache.set(key, res.data);
          this.lastLoadedResponse = res.data;
        }
      })
    );
  }

  getPurchaseById(id: number): Observable<ApiResponse<PurchaseResponse>> {
    return this.get<PurchaseResponse>(`/purchases/${id}`);
  }

  createPurchase(purchase: PurchaseRequest): Observable<ApiResponse<PurchaseResponse>> {
    this.clearCache();
    return this.post<PurchaseResponse>('/purchases', purchase);
  }

  cancelPurchase(id: number): Observable<ApiResponse<void>> {
    this.clearCache();
    return this.delete<void>(`/purchases/${id}`);
  }

  updatePurchaseStatus(id: number, req: PurchaseStatusChangeRequest): Observable<ApiResponse<PurchaseResponse>> {
    this.clearCache();
    return this.patch<PurchaseResponse>(`/purchases/${id}/status`, req);
  }

  getPurchasesBySupplier(
    supplierId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'purchaseDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<PurchaseResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<PurchaseResponse>>(`/purchases/supplier/${supplierId}`, params);
  }

  getPurchasesByStatus(
    statusId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'purchaseDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<PurchaseResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<PurchaseResponse>>(`/purchases/status/${statusId}`, params);
  }

  getPurchaseStatuses(): Observable<ApiResponse<PurchaseStatusResponse[]>> {
    return this.get<PurchaseStatusResponse[]>('/purchase-statuses');
  }

  getPurchaseStatusById(id: number): Observable<ApiResponse<PurchaseStatusResponse>> {
    return this.get<PurchaseStatusResponse>(`/purchase-statuses/${id}`);
  }

  getPurchaseItemById(id: number): Observable<ApiResponse<PurchaseItemResponse>> {
    return this.get<PurchaseItemResponse>(`/purchase-items/${id}`);
  }

  getPurchaseItemsByPurchaseId(purchaseId: number): Observable<ApiResponse<PurchaseItemResponse[]>> {
    return this.get<PurchaseItemResponse[]>(`/purchase-items/purchase/${purchaseId}`);
  }
}
