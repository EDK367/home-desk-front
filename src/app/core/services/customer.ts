import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import { CustomerRequest, CustomerResponse } from '../models/customer';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class CustomerService extends ApiService {

  getCustomers(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<CustomerResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<CustomerResponse>>('/customers', params);
  }

  getCustomersSales(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<CustomerResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<CustomerResponse>>('/customers/sales', params);
  }

  getCustomersAdmin(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<CustomerResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<CustomerResponse>>('/customers/admin', params);
  }

  getCustomerById(id: number): Observable<ApiResponse<CustomerResponse>> {
    return this.get<CustomerResponse>(`/customers/${id}`);
  }

  createCustomer(customer: CustomerRequest): Observable<ApiResponse<CustomerResponse>> {
    return this.post<CustomerResponse>('/customers', customer);
  }

  updateCustomer(id: number, customer: CustomerRequest): Observable<ApiResponse<CustomerResponse>> {
    return this.put<CustomerResponse>(`/customers/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<ApiResponse<void>> {
    return this.delete<void>(`/customers/${id}`);
  }
}
