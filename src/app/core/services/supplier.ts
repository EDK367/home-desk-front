import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import { SupplierRequest, SupplierResponse } from '../models/supplier';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class SupplierService extends ApiService {

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

    return this.get<PageResponse<SupplierResponse>>('/suppliers', params);
  }

  getSupplierById(id: number): Observable<ApiResponse<SupplierResponse>> {
    return this.get<SupplierResponse>(`/suppliers/${id}`);
  }

  createSupplier(supplier: SupplierRequest): Observable<ApiResponse<SupplierResponse>> {
    return this.post<SupplierResponse>('/suppliers', supplier);
  }

  updateSupplier(id: number, supplier: SupplierRequest): Observable<ApiResponse<SupplierResponse>> {
    return this.put<SupplierResponse>(`/suppliers/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<ApiResponse<void>> {
    return this.delete<void>(`/suppliers/${id}`);
  }
}
