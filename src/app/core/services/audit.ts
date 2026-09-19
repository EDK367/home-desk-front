import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import { PageResponse } from '../models/page';
import { ApiResponse } from '../models/response';
import { AuditLogResponse, AuditLogRequest } from '../models/audit';

@Injectable({
  providedIn: 'root'
})
export class AuditService extends ApiService {
  getAuditLogs(
    page: number = 0,
    size: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<AuditLogResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortField},${sortOrder}`);

    return this.get<PageResponse<AuditLogResponse>>('/audit-logs', params);
  }

  createAuditLog(request: AuditLogRequest): Observable<ApiResponse<AuditLogResponse>> {
    return this.post<AuditLogResponse>('/audit-logs', request);
  }
}
