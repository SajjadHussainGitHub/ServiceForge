import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';

const STORAGE_KEY = 'serviceforge_token';

const DEMO_USERS: ReadonlyArray<{ email: string; password: string; role: 'admin' | 'customer' }> = [
  { email: 'admin@serviceforge.com', password: 'Admin@123', role: 'admin' },
  { email: 'customer@serviceforge.com', password: 'Customer@123', role: 'customer' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(this.readToken());

  readonly isAuthenticated = () => this._token() !== null;
  readonly isAdmin = () => this.currentRole() === 'admin';

  currentRole(): 'admin' | 'customer' | null {
    const token = this._token();
    if (!token) {
      return null;
    }
    if (token.startsWith('admin-')) {
      return 'admin';
    }
    if (token.startsWith('customer-')) {
      return 'customer';
    }
    return null;
  }

  login(credentials: {
    email: string;
    password: string;
    rememberMe: boolean;
  }): Observable<{ token: string }> {
    const email = credentials.email?.trim().toLowerCase() ?? '';
    const password = credentials.password?.trim() ?? '';

    if (!email || !password) {
      return throwError(() => new Error('Email and password are required.'));
    }

    const matchedUser = DEMO_USERS.find(
      (user) => user.email.toLowerCase() === email && user.password === password,
    );

    if (!matchedUser) {
      return throwError(
        () =>
          new Error(
            'Invalid credentials. Use admin@serviceforge.com / Admin@123 or customer@serviceforge.com / Customer@123.',
          ),
      );
    }

    const token = `${matchedUser.role}-demo-jwt`;
    return of({ token }).pipe(
      delay(500),
      tap(() => {
        this._token.set(token);
        this.persistSession(token, credentials.rememberMe);
      }),
    );
  }

  logout(): void {
    this._token.set(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private persistSession(token: string, rememberMe: boolean): void {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      sessionStorage.setItem(STORAGE_KEY, token);
    }
  }

  private readToken(): string | null {
    return localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  }
}
