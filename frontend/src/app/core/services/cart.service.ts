import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { ApiResponse, Cart } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly apiPrefix = '/api/v1/cart';
  private readonly cartSubject = new BehaviorSubject<Cart | null>(null);
  private readonly cartLoadingSubject = new BehaviorSubject<boolean>(false);
  private cartLoadedForUserId: string | null = null;
  private pendingCartLoad$?: Observable<Cart>;

  readonly cart$ = this.cartSubject.asObservable();
  readonly cartLoading$ = this.cartLoadingSubject.asObservable();
  readonly cartItemCount$ = this.cart$.pipe(
    map(
      (cart) =>
        cart?.cartItems.reduce((total, item) => total + item.quantity, 0) ?? 0,
    ),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {
    this.authService.userId$.subscribe((userId) => {
      if (!userId) {
        this.resetCartState();
        return;
      }

      this.ensureCartLoaded().subscribe({
        error: () => undefined,
      });
    });
  }

  get cart(): Cart | null {
    return this.cartSubject.value;
  }

  getCart(): Observable<Cart> {
    const userId = this.authService.currentUser?._id;
    if (!userId) {
      this.resetCartState();
      return of(this.emptyCart());
    }

    return this.fetchCart(userId);
  }

  ensureCartLoaded(force = false): Observable<Cart | null> {
    const userId = this.authService.currentUser?._id;
    if (!userId) {
      this.resetCartState();
      return of(null);
    }

    if (!force && this.cartLoadedForUserId === userId) {
      return of(this.cartSubject.value);
    }

    return this.fetchCart(userId);
  }

  refreshCart(): Observable<Cart | null> {
    return this.ensureCartLoaded(true);
  }

  addToCart(mealId: string, quantity = 1): Observable<Cart> {
    return this.http
      .post<ApiResponse>(this.apiPrefix, { mealId, quantity })
      .pipe(switchMap(() => this.refreshCartAndRequire()));
  }

  updateQuantity(mealId: string, quantity: number): Observable<Cart> {
    return this.http
      .patch<ApiResponse>(`${this.apiPrefix}/${mealId}`, { quantity })
      .pipe(switchMap(() => this.refreshCartAndRequire()));
  }

  removeItem(mealId: string): Observable<Cart> {
    return this.http
      .delete<ApiResponse>(`${this.apiPrefix}/${mealId}`)
      .pipe(switchMap(() => this.refreshCartAndRequire()));
  }

  clearCart(): Observable<Cart> {
    return this.http
      .delete<ApiResponse>(`${this.apiPrefix}/clear`)
      .pipe(switchMap(() => this.refreshCartAndRequire()));
  }

  private fetchCart(userId: string): Observable<Cart> {
    if (!this.pendingCartLoad$) {
      this.cartLoadingSubject.next(true);
      this.pendingCartLoad$ = this.http
        .get<ApiResponse<{ cart: Cart }>>(this.apiPrefix)
        .pipe(
          map((res) => this.pick(res.data?.cart, 'cart')),
          tap((cart) => this.setCart(cart, userId)),
          finalize(() => {
            this.cartLoadingSubject.next(false);
            this.pendingCartLoad$ = undefined;
          }),
          shareReplay(1),
        );
    }

    return this.pendingCartLoad$;
  }

  private setCart(cart: Cart, userId = this.authService.currentUser?._id): void {
    this.cartSubject.next(cart);
    this.cartLoadedForUserId = userId ?? this.cartLoadedForUserId;
  }

  private resetCartState(): void {
    this.pendingCartLoad$ = undefined;
    this.cartLoadedForUserId = null;
    this.cartLoadingSubject.next(false);
    this.cartSubject.next(null);
  }

  private emptyCart(): Cart {
    return {
      user: this.authService.currentUser?._id ?? '',
      cartItems: [],
      totalPrice: 0,
    };
  }

  private pick<T>(value: T | undefined, key: string): T {
    if (value === undefined || value === null) {
      throw new Error(`Malformed response: missing ${key}`);
    }
    return value;
  }

  private refreshCartAndRequire(): Observable<Cart> {
    return this.refreshCart().pipe(map((cart) => cart ?? this.emptyCart()));
  }
}
