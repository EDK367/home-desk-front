import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from './api';
import { UserRequest, UserResponse } from '../models/user';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class UserService extends ApiService {
  private cache = new Map<string, PageResponse<UserResponse>>();
  private lastLoadedResponse: PageResponse<UserResponse> | null = null;

  getCachedUsers(
    page: number, 
    size: number, 
    sortField: string, 
    sortOrder: string, 
    includeInactive: boolean
  ): PageResponse<UserResponse> | null {
    const key = `${page}_${size}_${sortField}_${sortOrder}_${includeInactive}`;
    return this.cache.get(key) || this.lastLoadedResponse || null;
  }

  getLastLoadedUsers(): PageResponse<UserResponse> | null {
    return this.lastLoadedResponse;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getUsers(
    page: number = 0, 
    size: number = 10, 
    sortField: string = 'createdAt', 
    sortOrder: 'ASC' | 'DESC' = 'DESC', 
    includeInactive: boolean = false
  ): Observable<ApiResponse<PageResponse<UserResponse>>> {
    const sortValue = `${sortField},${sortOrder}`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sortValue)
      .set('includeInactive', includeInactive.toString());

    const key = `${page}_${size}_${sortField}_${sortOrder}_${includeInactive}`;

    return this.get<PageResponse<UserResponse>>('/users', params).pipe(
      tap(res => {
        if (res && res.data) {
          this.cache.set(key, res.data);
          this.lastLoadedResponse = res.data;
        }
      })
    );
  }

  createUser(user: UserRequest): Observable<ApiResponse<UserResponse>> {
    this.clearCache();
    return this.post<UserResponse>('/users', user);
  }

  updateUser(id: string, user: UserRequest): Observable<ApiResponse<UserResponse>> {
    this.clearCache();
    return this.put<UserResponse>(`/users/${id}`, user);
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    this.clearCache();
    return this.delete<void>(`/users/${id}`);
  }
}
