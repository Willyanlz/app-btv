import { Injectable } from '@angular/core';
const SESSION_KEY = 'universal_remote_session';
const ACCESS_PASSWORD = '270815';
export interface LocalSession {
  authenticated: boolean;
  signedInAt: string;
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  login(password: string): boolean {
    if (password !== ACCESS_PASSWORD) return false;
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        authenticated: true,
        signedInAt: new Date().toISOString(),
      }),
    );
    return true;
  }
  isAuthenticated(): boolean {
    try {
      return (
        JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
          ?.authenticated === true
      );
    } catch {
      return false;
    }
  }
  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  }
}
