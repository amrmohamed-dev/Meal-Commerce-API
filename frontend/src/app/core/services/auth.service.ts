import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { ApiResponse, User } from '../models/api.models';

type AuthPayload = {
  email: string;
  password: string;
};

type RegisterPayload = AuthPayload & {
  name: string;
  passwordConfirm: string;
};

type ResetPasswordPayload = {
  email: string;
  otp: string;
  password: string;
  passwordConfirm: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiPrefix = '/api/v1';
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionChecked = false;
  private pendingSession$?: Observable<User | null>;

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly userId$ = this.currentUser$.pipe(
    map((user) => user?._id ?? null),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly isAuthenticated$ = this.userId$.pipe(
    map((userId) => userId !== null),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(private readonly http: HttpClient) {}

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  bootstrapSession(): Observable<User | null> {
    if (this.sessionChecked) {
      return of(this.currentUser);
    }

    if (!this.pendingSession$) {
      this.pendingSession$ = this.http
        .get<ApiResponse<{ user: User }>>(`${this.apiPrefix}/users/me`)
        .pipe(
          map((res) => res.data?.user ?? null),
          tap((user) => this.currentUserSubject.next(user)),
          catchError(() => {
            this.currentUserSubject.next(null);
            return of(null);
          }),
          finalize(() => {
            this.sessionChecked = true;
            this.pendingSession$ = undefined;
          }),
          shareReplay(1),
        );
    }

    return this.pendingSession$;
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http
      .post<ApiResponse<{ user: User }>>(`${this.apiPrefix}/auth/register`, payload)
      .pipe(map((res) => this.syncUser(res.data?.user)));
  }

  login(payload: AuthPayload): Observable<User> {
    return this.http
      .post<ApiResponse<{ user: User }>>(`${this.apiPrefix}/auth/login`, payload)
      .pipe(map((res) => this.syncUser(res.data?.user)));
  }

  sendOtp(
    purpose: 'Email Confirmation' | 'Password Recovery',
    payload?: { email?: string },
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.apiPrefix}/auth/send-otp/${encodeURIComponent(purpose)}`,
      payload ?? {},
    );
  }

  verifyOtp(
    purpose: 'Email Confirmation' | 'Password Recovery',
    payload: { email: string; otp: string },
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.apiPrefix}/auth/verify-otp/${encodeURIComponent(purpose)}`,
      payload,
    );
  }

  verifyEmail(otp: string): Observable<User> {
    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.apiPrefix}/auth/verify-email`, {
        otp,
      })
      .pipe(map((res) => this.syncUser(res.data?.user)));
  }

  resetPassword(payload: ResetPasswordPayload): Observable<User> {
    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.apiPrefix}/auth/reset-password`, payload)
      .pipe(map((res) => this.syncUser(res.data?.user)));
  }

  logout(): Observable<void> {
    return this.http.get<ApiResponse<unknown>>(`${this.apiPrefix}/auth/logout`).pipe(
      tap(() => this.clearSession()),
      map(() => undefined),
    );
  }

  clearSession(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.sessionChecked = true;
  }

  updateSessionUser(user: User): void {
    this.currentUserSubject.next(user);
    this.sessionChecked = true;
  }

  patchSessionUser(patch: Partial<User>): void {
    const current = this.currentUserSubject.value;
    if (!current) {
      return;
    }

    this.currentUserSubject.next({
      ...current,
      ...patch,
    });
    this.sessionChecked = true;
  }

  private syncUser(user: User | undefined): User {
    if (!user) {
      throw new Error('Malformed auth response: user not found');
    }
    this.currentUserSubject.next(user);
    this.sessionChecked = true;
    return user;
  }
}
