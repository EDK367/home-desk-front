import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import { PaymentMethodRequest, PaymentMethodResponse } from '../models/payment';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService extends ApiService {

  getPaymentMethodsSales(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<PaymentMethodResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<PaymentMethodResponse>>('/payment-methods/sales', params);
  }

  getPaymentMethodsAdmin(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<PaymentMethodResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<PaymentMethodResponse>>('/payment-methods/admin', params);
  }

  getPaymentMethodById(id: number): Observable<ApiResponse<PaymentMethodResponse>> {
    return this.get<PaymentMethodResponse>(`/payment-methods/${id}`);
  }

  createPaymentMethod(method: PaymentMethodRequest): Observable<ApiResponse<PaymentMethodResponse>> {
    return this.post<PaymentMethodResponse>('/payment-methods', method);
  }

  updatePaymentMethod(id: number, method: PaymentMethodRequest): Observable<ApiResponse<PaymentMethodResponse>> {
    return this.put<PaymentMethodResponse>(`/payment-methods/${id}`, method);
  }

  deletePaymentMethod(id: number): Observable<ApiResponse<void>> {
    return this.delete<void>(`/payment-methods/${id}`);
  }
}
