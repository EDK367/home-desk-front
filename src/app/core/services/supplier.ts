import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from './api';
import { SupplierRequest, SupplierResponse } from '../models/supplier';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class SupplierService extends ApiService {
  private cache = new Map<string, PageResponse<SupplierResponse>>();
  private lastLoadedResponse: PageResponse<SupplierResponse> | null = null;

  getCachedSuppliers(
    page: number,
    size: number,
    sortField: string,
    sortOrder: string,
    includeInactive: boolean
  ): PageResponse<SupplierResponse> | null {
    const key = `${page}_${size}_${sortField}_${sortOrder}_${includeInactive}`;
    return this.cache.get(key) || this.lastLoadedResponse || null;
  }

  clearCache(): void {
    this.cache.clear();
    this.lastLoadedResponse = null;
  }

  getSuppliers(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
    includeInactive: boolean = false
  ): Observable<ApiResponse<PageResponse<SupplierResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`)
      .set('includeInactive', includeInactive.toString());

    const key = `${page}_${size}_${sortField}_${sortOrder}_${includeInactive}`;

    return this.get<PageResponse<SupplierResponse>>('/suppliers', params).pipe(
      tap(res => {
        if (res?.data) {
          this.cache.set(key, res.data);
          this.lastLoadedResponse = res.data;
        }
      })
    );
  }

  getSupplierById(id: number): Observable<ApiResponse<SupplierResponse>> {
    return this.get<SupplierResponse>(`/suppliers/${id}`);
  }

  createSupplier(supplier: SupplierRequest): Observable<ApiResponse<SupplierResponse>> {
    this.clearCache();
    return this.post<SupplierResponse>('/suppliers', supplier);
  }

  updateSupplier(id: number, supplier: SupplierRequest): Observable<ApiResponse<SupplierResponse>> {
    this.clearCache();
    return this.put<SupplierResponse>(`/suppliers/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<ApiResponse<void>> {
    this.clearCache();
    return this.delete<void>(`/suppliers/${id}`);
  }
}
