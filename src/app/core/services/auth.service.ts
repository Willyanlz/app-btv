import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
const SESSION_KEY = 'universal_remote_session';
const TOKEN_KEY = 'universal_remote_api_token';
const ACCESS_PASSWORD = '270815';
export interface LocalSession {
  authenticated: boolean;
  signedInAt: string;
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(password: string) {
    if (password !== ACCESS_PASSWORD) return of(false);
    return this.http.post<{ token: string }>(`${environment.apiUrl}/api/auth/login`, { password }).pipe(
      tap(({ token }) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ authenticated: true, signedInAt: new Date().toISOString() }));
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }
  isAuthenticated(): boolean {
    try {
      return (
        JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
          ?.authenticated === true && !!this.token()
      );
    } catch {
      return false;
    }
  }
  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  token(): string | null { return localStorage.getItem(TOKEN_KEY); }
}
