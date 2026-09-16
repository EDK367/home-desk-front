import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import {
  SupplierProductRequest,
  SupplierProductResponse,
  SupplierProductUpdateRequest
} from '../models/supplier';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class SupplierProductService extends ApiService {

  getSupplierProducts(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    supplierId?: number,
    productId?: number
  ): Observable<ApiResponse<PageResponse<SupplierProductResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    if (supplierId != null) {
      params = params.set('supplierId', supplierId.toString());
    }
    if (productId != null) {
      params = params.set('productId', productId.toString());
    }

    return this.get<PageResponse<SupplierProductResponse>>('/supplier-products', params);
  }

  getSupplierProductById(id: number): Observable<ApiResponse<SupplierProductResponse>> {
    return this.get<SupplierProductResponse>(`/supplier-products/${id}`);
  }

  createSupplierProduct(req: SupplierProductRequest): Observable<ApiResponse<SupplierProductResponse>> {
    return this.post<SupplierProductResponse>('/supplier-products', req);
  }

  updateSupplierProduct(id: number, req: SupplierProductUpdateRequest): Observable<ApiResponse<SupplierProductResponse>> {
    return this.put<SupplierProductResponse>(`/supplier-products/${id}`, req);
  }

  deleteSupplierProduct(id: number): Observable<ApiResponse<void>> {
    return this.delete<void>(`/supplier-products/${id}`);
  }

  getProductsBySupplier(
    supplierId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<SupplierProductResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<SupplierProductResponse>>(`/supplier-products/supplier/${supplierId}`, params);
  }

  getSuppliersByProduct(
    productId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<SupplierProductResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<SupplierProductResponse>>(`/supplier-products/product/${productId}`, params);
  }

  deleteBySupplierAndProduct(supplierId: number, productId: number): Observable<ApiResponse<void>> {
    return this.delete<void>(`/supplier-products/supplier/${supplierId}/product/${productId}`);
  }
}
