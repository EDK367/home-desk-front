import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import { LoginRequest, LoginResponse, LogoutRequest } from '../models/auth';
import { ApiResponse } from '../models/response';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends ApiService {

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/auth/login', credentials);
  }

  logout(body?: LogoutRequest): Observable<ApiResponse<void>> {
    return this.post<void>('/auth/logout', body ?? {});
  }

}