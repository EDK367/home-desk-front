import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import { ApiResponse } from '../models/response';
import { PageResponse } from '../models/page';
import {
  VwProductsLowestStock,
  VwProductsMostFrequentlyPurchased,
  VwProductsMostInventoryMovement,
  VwTop5SuppliersByPurchase,
  VwTop10CustomersBySale,
  VwTop10ProductsByRevenue,
  VwTop10ProductsSold
} from '../models/views';

@Injectable({
  providedIn: 'root',
})
export class ReportService extends ApiService {

  getTop10ProductsSold(): Observable<ApiResponse<VwTop10ProductsSold[]>> {
    return this.get<VwTop10ProductsSold[]>('/reports/top-products-sold');
  }

  getTop10ProductsRevenue(): Observable<ApiResponse<VwTop10ProductsByRevenue[]>> {
    return this.get<VwTop10ProductsByRevenue[]>('/reports/top-products-revenue');
  }

  getTop10CustomersSales(): Observable<ApiResponse<VwTop10CustomersBySale[]>> {
    return this.get<VwTop10CustomersBySale[]>('/reports/top-customers-sales');
  }

  getTop5SuppliersPurchases(): Observable<ApiResponse<VwTop5SuppliersByPurchase[]>> {
    return this.get<VwTop5SuppliersByPurchase[]>('/reports/top-suppliers-purchases');
  }

  getProductsLowestStock(
    page: number = 0,
    size: number = 10,
    sortField: string = 'quantityOnHand',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Observable<ApiResponse<PageResponse<VwProductsLowestStock>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<VwProductsLowestStock>>('/reports/products-lowest-stock', params);
  }

  getProductsMostFrequentlyPurchased(
    page: number = 0,
    size: number = 10,
    sortField: string = 'purchaseCount',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<VwProductsMostFrequentlyPurchased>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<VwProductsMostFrequentlyPurchased>>('/reports/products-most-frequently-purchased', params);
  }

  getProductsMostInventoryMovements(
    page: number = 0,
    size: number = 10,
    sortField: string = 'movementCount',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<VwProductsMostInventoryMovement>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<VwProductsMostInventoryMovement>>('/reports/products-most-inventory-movements', params);
  }
}


export { ReportService as Report };
