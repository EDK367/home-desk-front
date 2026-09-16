import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import {
  ProductRequest,
  ProductResponse,
  ProductStockResponse
} from '../models/product';
import { ChangeCategoryRequest, ChangeMinStockRequest } from '../models/category';
import { ChangeSalePriceRequest } from '../models/sale';
import { ManualStockAdjustmentRequest } from '../models/inventory';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends ApiService {

  getProducts(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<ProductResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<ProductResponse>>('/products', params);
  }

  getProductsAdmin(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<ProductResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<ProductResponse>>('/products/admin', params);
  }

  getProductById(id: number): Observable<ApiResponse<ProductResponse>> {
    return this.get<ProductResponse>(`/products/${id}`);
  }

  createProduct(product: ProductRequest): Observable<ApiResponse<ProductResponse>> {
    return this.post<ProductResponse>('/products', product);
  }

  updateProduct(id: number, product: ProductRequest): Observable<ApiResponse<ProductResponse>> {
    return this.put<ProductResponse>(`/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<ApiResponse<void>> {
    return this.delete<void>(`/products/${id}`);
  }

  updateStatus(id: number, active: boolean): Observable<ApiResponse<ProductResponse>> {
    const params = new HttpParams().set('active', active.toString());
    return this.patch<ProductResponse>(`/products/${id}/status`, null, params);
  }

  changeSalePrice(id: number, req: ChangeSalePriceRequest): Observable<ApiResponse<ProductResponse>> {
    return this.patch<ProductResponse>(`/products/${id}/sale-price`, req);
  }

  changeMinStock(id: number, req: ChangeMinStockRequest): Observable<ApiResponse<ProductResponse>> {
    return this.patch<ProductResponse>(`/products/${id}/min-stock`, req);
  }

  changeCategory(id: number, req: ChangeCategoryRequest): Observable<ApiResponse<ProductResponse>> {
    return this.patch<ProductResponse>(`/products/${id}/category`, req);
  }

  getStock(id: number): Observable<ApiResponse<ProductStockResponse>> {
    return this.get<ProductStockResponse>(`/products/${id}/stock`);
  }

  adjustStock(id: number, req: ManualStockAdjustmentRequest): Observable<ApiResponse<ProductResponse>> {
    return this.post<ProductResponse>(`/products/${id}/stock/adjustment`, req);
  }
}
