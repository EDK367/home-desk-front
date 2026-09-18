import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import { CategoryRequest, CategoryResponse } from '../models/category';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends ApiService {

  getCategories(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<CategoryResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<CategoryResponse>>('/categories', params);
  }

  getCategoriesAdmin(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<CategoryResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<CategoryResponse>>('/categories/admin', params);
  }

  createCategory(category: CategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.post<CategoryResponse>('/categories', category);
  }

  updateCategory(id: number, category: CategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.put<CategoryResponse>(`/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.delete<void>(`/categories/${id}`);
  }
}
