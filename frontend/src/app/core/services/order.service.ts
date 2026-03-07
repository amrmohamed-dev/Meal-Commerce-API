import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  finalize,
  map,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { ApiResponse, Order, OrderStat, OrderStatus } from '../models/api.models';
import { AuthService } from './auth.service';

type ShippingAddressPayload = {
  street: string;
  city: string;
  phone: string;
};

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly apiPrefix = '/api/v1/orders';
  private readonly myOrdersSubject = new BehaviorSubject<Order[]>([]);
  private readonly allOrdersSubject = new BehaviorSubject<Order[]>([]);
  private readonly orderStatsSubject = new BehaviorSubject<OrderStat[]>([]);
  private readonly myOrdersLoadingSubject = new BehaviorSubject<boolean>(false);
  private readonly allOrdersLoadingSubject = new BehaviorSubject<boolean>(false);
  private readonly orderStatsLoadingSubject = new BehaviorSubject<boolean>(false);
  private myOrdersLoadedForUserId: string | null = null;
  private allOrdersLoaded = false;
  private orderStatsLoaded = false;
  private pendingMyOrders$?: Observable<Order[]>;
  private pendingAllOrders$?: Observable<Order[]>;
  private pendingOrderStats$?: Observable<OrderStat[]>;

  readonly myOrders$ = this.myOrdersSubject.asObservable();
  readonly allOrders$ = this.allOrdersSubject.asObservable();
  readonly orderStats$ = this.orderStatsSubject.asObservable();
  readonly myOrdersLoading$ = this.myOrdersLoadingSubject.asObservable();
  readonly allOrdersLoading$ = this.allOrdersLoadingSubject.asObservable();
  readonly orderStatsLoading$ = this.orderStatsLoadingSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {
    this.authService.userId$.subscribe((userId) => {
      if (!userId) {
        this.resetSessionState();
      }
    });
  }

  createOrder(shippingAddress: ShippingAddressPayload): Observable<Order> {
    return this.http
      .post<ApiResponse<{ order: Order }>>(this.apiPrefix, { shippingAddress })
      .pipe(
        map((res) => this.pick(res.data?.order, 'order')),
        tap((order) => {
          const current = this.myOrdersSubject.value;
          this.myOrdersSubject.next([...current, order]);
          this.myOrdersLoadedForUserId = this.authService.currentUser?._id ?? null;
        }),
      );
  }

  getMyOrders(): Observable<Order[]> {
    return this.ensureMyOrdersLoaded(true);
  }

  ensureMyOrdersLoaded(force = false): Observable<Order[]> {
    const userId = this.authService.currentUser?._id;
    if (!userId) {
      this.myOrdersSubject.next([]);
      this.myOrdersLoadedForUserId = null;
      return of([]);
    }

    if (!force && this.myOrdersLoadedForUserId === userId) {
      return of(this.myOrdersSubject.value);
    }

    return this.fetchMyOrders(userId);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http
      .get<ApiResponse<{ order: Order }>>(`${this.apiPrefix}/${id}`)
      .pipe(map((res) => this.pick(res.data?.order, 'order')));
  }

  cancelOrder(id: string): Observable<void> {
    return this.http
      .patch<ApiResponse<unknown>>(`${this.apiPrefix}/${id}/cancel`, {})
      .pipe(
        map(() => undefined),
        tap(() => {
          const myOrders = this.myOrdersSubject.value;
          const allOrders = this.allOrdersSubject.value;
          this.myOrdersSubject.next(
            myOrders.map((o) =>
              o._id === id
                ? {
                    ...o,
                    status: 'cancelled',
                  }
                : o,
            ),
          );
          this.allOrdersSubject.next(
            allOrders.map((o) =>
              o._id === id
                ? {
                    ...o,
                    status: 'cancelled',
                  }
                : o,
            ),
          );
        }),
      );
  }

  getAllOrders(): Observable<Order[]> {
    return this.ensureAllOrdersLoaded(true);
  }

  ensureAllOrdersLoaded(force = false): Observable<Order[]> {
    if (!force && this.allOrdersLoaded) {
      return of(this.allOrdersSubject.value);
    }

    return this.fetchAllOrders();
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http
      .patch<ApiResponse<{ order: Order }>>(`${this.apiPrefix}/${id}/status`, { status })
      .pipe(
        map((res) => this.pick(res.data?.order, 'order')),
        tap((order) => {
          const myOrders = this.myOrdersSubject.value;
          const allOrders = this.allOrdersSubject.value;
          this.myOrdersSubject.next(myOrders.map((o) => (o._id === id ? order : o)));
          this.allOrdersSubject.next(allOrders.map((o) => (o._id === id ? order : o)));
        }),
      );
  }

  getOrderStats(): Observable<OrderStat[]> {
    return this.ensureOrderStatsLoaded(true);
  }

  ensureOrderStatsLoaded(force = false): Observable<OrderStat[]> {
    if (!force && this.orderStatsLoaded) {
      return of(this.orderStatsSubject.value);
    }

    return this.fetchOrderStats();
  }

  private fetchMyOrders(userId: string): Observable<Order[]> {
    if (!this.pendingMyOrders$) {
      this.myOrdersLoadingSubject.next(true);
      this.pendingMyOrders$ = this.http
        .get<ApiResponse<{ orders: Order[] }>>(`${this.apiPrefix}/me`)
        .pipe(
          map((res) => this.pick(res.data?.orders, 'orders')),
          tap((orders) => {
            this.myOrdersSubject.next(orders);
            this.myOrdersLoadedForUserId = userId;
          }),
          finalize(() => {
            this.myOrdersLoadingSubject.next(false);
            this.pendingMyOrders$ = undefined;
          }),
          shareReplay(1),
        );
    }

    return this.pendingMyOrders$;
  }

  private fetchAllOrders(): Observable<Order[]> {
    if (!this.pendingAllOrders$) {
      this.allOrdersLoadingSubject.next(true);
      this.pendingAllOrders$ = this.http
        .get<ApiResponse<{ orders: Order[] }>>(this.apiPrefix)
        .pipe(
          map((res) => this.pick(res.data?.orders, 'orders')),
          tap((orders) => {
            this.allOrdersSubject.next(orders);
            this.allOrdersLoaded = true;
          }),
          finalize(() => {
            this.allOrdersLoadingSubject.next(false);
            this.pendingAllOrders$ = undefined;
          }),
          shareReplay(1),
        );
    }

    return this.pendingAllOrders$;
  }

  private fetchOrderStats(): Observable<OrderStat[]> {
    if (!this.pendingOrderStats$) {
      this.orderStatsLoadingSubject.next(true);
      this.pendingOrderStats$ = this.http
        .get<ApiResponse<{ stats: OrderStat[] }>>(`${this.apiPrefix}/stats`)
        .pipe(
          map((res) => this.pick(res.data?.stats, 'stats')),
          tap((stats) => {
            this.orderStatsSubject.next(stats);
            this.orderStatsLoaded = true;
          }),
          finalize(() => {
            this.orderStatsLoadingSubject.next(false);
            this.pendingOrderStats$ = undefined;
          }),
          shareReplay(1),
        );
    }

    return this.pendingOrderStats$;
  }

  private resetSessionState(): void {
    this.pendingMyOrders$ = undefined;
    this.pendingAllOrders$ = undefined;
    this.pendingOrderStats$ = undefined;
    this.myOrdersLoadedForUserId = null;
    this.allOrdersLoaded = false;
    this.orderStatsLoaded = false;
    this.myOrdersLoadingSubject.next(false);
    this.allOrdersLoadingSubject.next(false);
    this.orderStatsLoadingSubject.next(false);
    this.myOrdersSubject.next([]);
    this.allOrdersSubject.next([]);
    this.orderStatsSubject.next([]);
  }

  private pick<T>(value: T | undefined, key: string): T {
    if (value === undefined || value === null) {
      throw new Error(`Malformed response: missing ${key}`);
    }
    return value;
  }
}
