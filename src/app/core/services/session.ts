import { Injectable } from '@angular/core';
import { UserSummaryResponse } from '../models/auth.model';

const USER_KEY = 'hd_user';

@Injectable({ providedIn: 'root' })
export class SessionService {

  saveUser(user: UserSummaryResponse): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser(): UserSummaryResponse | null {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getRole(): string | null {
    return this.getUser()?.role ?? null;
  }

  clearUser(): void {
    sessionStorage.removeItem(USER_KEY);
  }
}
