import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from './api';
import { RoleResponse } from '../models/role';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class RoleService extends ApiService {
  private cachedRoles: RoleResponse[] | null = null;

  getRoles(): Observable<ApiResponse<RoleResponse[]>> {
    if (this.cachedRoles) {
      return of({ status: 200, message: 'OK', data: this.cachedRoles, timestamp: new Date().toISOString() });
    }
    return this.get<RoleResponse[]>('/roles').pipe(
      tap(res => {
        if (res && res.data) {
          this.cachedRoles = res.data;
        }
      })
    );
  }

}
