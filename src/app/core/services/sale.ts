import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import {
  SaleRequest,
  SaleResponse,
  SaleStatusResponse,
  SaleStatusChangeRequest,
  SaleItemResponse,
  SalePaymentRequest,
  SalePaymentResponse
} from '../models/sale';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class SaleService extends ApiService {

  getSales(
    page: number = 0,
    size: number = 10,
    sortField: string = 'saleDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<SaleResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<SaleResponse>>('/sales', params);
  }

  getSaleById(id: number): Observable<ApiResponse<SaleResponse>> {
    return this.get<SaleResponse>(`/sales/${id}`);
  }

  createSale(sale: SaleRequest): Observable<ApiResponse<SaleResponse>> {
    return this.post<SaleResponse>('/sales', sale);
  }

  cancelSale(id: number): Observable<ApiResponse<void>> {
    return this.delete<void>(`/sales/${id}`);
  }

  updateSaleStatus(id: number, req: SaleStatusChangeRequest): Observable<ApiResponse<SaleResponse>> {
    return this.patch<SaleResponse>(`/sales/${id}/status`, req);
  }

  getSalesByStatus(
    statusId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'saleDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<SaleResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<SaleResponse>>(`/sales/status/${statusId}`, params);
  }

  getSaleByInvoiceNumber(invoiceNumber: string): Observable<ApiResponse<SaleResponse>> {
    return this.get<SaleResponse>(`/sales/invoice/${invoiceNumber}`);
  }

  getSalesByCustomer(
    customerId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'saleDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<SaleResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<SaleResponse>>(`/sales/customer/${customerId}`, params);
  }

  getSaleStatuses(): Observable<ApiResponse<SaleStatusResponse[]>> {
    return this.get<SaleStatusResponse[]>('/sale-statuses');
  }

  getSaleStatusById(id: number): Observable<ApiResponse<SaleStatusResponse>> {
    return this.get<SaleStatusResponse>(`/sale-statuses/${id}`);
  }

  getSaleItemById(id: number): Observable<ApiResponse<SaleItemResponse>> {
    return this.get<SaleItemResponse>(`/sale-items/${id}`);
  }

  getSaleItemsBySaleId(saleId: number): Observable<ApiResponse<SaleItemResponse[]>> {
    return this.get<SaleItemResponse[]>(`/sale-items/sale/${saleId}`);
  }

  createSalePayment(req: SalePaymentRequest): Observable<ApiResponse<SalePaymentResponse>> {
    return this.post<SalePaymentResponse>('/sale-payments', req);
  }

  getSalePaymentById(id: number): Observable<ApiResponse<SalePaymentResponse>> {
    return this.get<SalePaymentResponse>(`/sale-payments/${id}`);
  }

  deleteSalePayment(id: number): Observable<ApiResponse<void>> {
    return this.delete<void>(`/sale-payments/${id}`);
  }

  getSalePaymentsBySale(
    saleId: number,
    page: number = 0,
    size: number = 10,
    sortField: string = 'paymentDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<SalePaymentResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<SalePaymentResponse>>(`/sale-payments/sale/${saleId}`, params);
  }
}
