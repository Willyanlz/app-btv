import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const SESSION_KEY = 'universal_remote_session';
const TOKEN_KEY = 'universal_remote_api_token';

export interface LocalSession {
  authenticated: boolean;
  signedInAt: string;
}

interface JwtPayload {
  exp?: number;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(password: string) {
    return this.http
      .post<{ token: string }>(`${environment.apiUrl}/api/v1/auth/login`, { password })
      .pipe(
        tap(({ token }) => {
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ authenticated: true, signedInAt: new Date().toISOString() }),
          );
        }),
        map(() => true),
        catchError(() => of(false)),
      );
  }

  isAuthenticated(): boolean {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as
        | LocalSession
        | null;
      const token = this.token();
      return session?.authenticated === true && !!token && !this.isExpired(token);
    } catch {
      return false;
    }
  }

  private isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
