import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import {
  InventoryResponse,
  InventoryLotResponse,
  InventoryMovementResponse,
  InventoryMovementLotResponse,
  ManualStockAdjustmentRequest
} from '../models/inventory';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class InventoryService extends ApiService {

  getInventories(
    page: number = 0,
    size: number = 10,
    sortField: string = 'updatedAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<InventoryResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<InventoryResponse>>('/inventories', params);
  }

  getInventoryById(id: number): Observable<ApiResponse<InventoryResponse>> {
    return this.get<InventoryResponse>(`/inventories/${id}`);
  }

  getInventoryByProductId(productId: number): Observable<ApiResponse<InventoryResponse>> {
    return this.get<InventoryResponse>(`/inventories/product/${productId}`);
  }

  getLowStock(
    page: number = 0,
    size: number = 10,
    sortField: string = 'quantityOnHand',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Observable<ApiResponse<PageResponse<InventoryResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<InventoryResponse>>('/inventories/low-stock', params);
  }

  getInventoryByCategory(
    categoryId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'updatedAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<InventoryResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<InventoryResponse>>(`/inventories/category/${categoryId}`, params);
  }

  adjustInventoryStock(
    productId: number,
    req: ManualStockAdjustmentRequest
  ): Observable<ApiResponse<InventoryResponse>> {
    return this.post<InventoryResponse>(`/inventories/product/${productId}/adjust`, req);
  }

  getInventoryLots(
    page: number = 0,
    size: number = 10,
    sortField: string = 'receivedAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<InventoryLotResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<InventoryLotResponse>>('/inventory-lots', params);
  }

  getInventoryLotById(id: number): Observable<ApiResponse<InventoryLotResponse>> {
    return this.get<InventoryLotResponse>(`/inventory-lots/${id}`);
  }

  getInventoryLotsByProduct(
    productId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'receivedAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<InventoryLotResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<InventoryLotResponse>>(`/inventory-lots/product/${productId}`, params);
  }

  getActiveLotsByProduct(productId: number): Observable<ApiResponse<InventoryLotResponse[]>> {
    return this.get<InventoryLotResponse[]>(`/inventory-lots/product/${productId}/active`);
  }

  getInventoryMovements(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    startDate?: string,
    endDate?: string,
    movementType?: string
  ): Observable<ApiResponse<PageResponse<InventoryMovementResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (movementType) params = params.set('movementType', movementType);

    return this.get<PageResponse<InventoryMovementResponse>>('/inventory-movements', params);
  }

  getInventoryMovementById(id: number): Observable<ApiResponse<InventoryMovementResponse>> {
    return this.get<InventoryMovementResponse>(`/inventory-movements/${id}`);
  }

  getMovementsByType(
    movementType: string,
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<InventoryMovementResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<InventoryMovementResponse>>(`/inventory-movements/type/${movementType}`, params);
  }

  getMovementsByProduct(
    productId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    startDate?: string,
    endDate?: string
  ): Observable<ApiResponse<PageResponse<InventoryMovementResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.get<PageResponse<InventoryMovementResponse>>(`/inventory-movements/product/${productId}`, params);
  }

  getMovementLotById(id: number): Observable<ApiResponse<InventoryMovementLotResponse>> {
    return this.get<InventoryMovementLotResponse>(`/inventory-movement-lots/${id}`);
  }

  getMovementLotsByMovementId(movementId: number): Observable<ApiResponse<InventoryMovementLotResponse[]>> {
    return this.get<InventoryMovementLotResponse[]>(`/inventory-movement-lots/movement/${movementId}`);
  }

  getMovementLotsByLotId(lotId: number): Observable<ApiResponse<InventoryMovementLotResponse[]>> {
    return this.get<InventoryMovementLotResponse[]>(`/inventory-movement-lots/lot/${lotId}`);
  }
}
