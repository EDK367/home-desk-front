import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { ApiResponse } from '../models/response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends ApiService {

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/auth/login', credentials);
  }

}