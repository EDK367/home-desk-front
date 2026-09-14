import { Injectable } from '@angular/core';

const ACCESS_KEY  = 'hd_access_token';
const REFRESH_KEY = 'hd_refresh_token';

@Injectable({
  providedIn: 'root',
})
export class TokenService {

  saveTokens(accessToken: string, refreshToken: string, refreshExpirationSeconds: number): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    this.setRefreshCookie(refreshToken, refreshExpirationSeconds);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return this.getCookie(REFRESH_KEY);
  }

  hasToken(): boolean {
    return !!this.getAccessToken();
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_KEY);
    this.deleteCookie(REFRESH_KEY);
  }

  private setRefreshCookie(value: string, maxAgeSeconds: number): void {
    const secure   = location.protocol === 'https:' ? '; Secure' : '';
    const sameSite = '; SameSite=Strict';
    document.cookie = `${REFRESH_KEY}=${value}; Max-Age=${maxAgeSeconds}; Path=/${secure}${sameSite}`;
  }

  private getCookie(name: string): string | null {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`));

    return match ? match.split('=')[1] : null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}
