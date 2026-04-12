import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  defer,
  finalize,
  map,
  of,
  shareReplay,
  startWith,
  take,
} from 'rxjs';
import { Order, OrderStatus } from '../../../../core/models/api.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { OrderService } from '../../../../core/services/order.service';

type LoadingState<T> = {
  loading: boolean;
  data: T;
};

type AdminOrderRow = Order & {
  isUpdating: boolean;
  userName: string;
};

@Component({
  selector: 'app-admin-orders-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
})
export class AdminOrdersPageComponent {
  private readonly updatingOrderIdsSubject = new BehaviorSubject<string[]>([]);

  private readonly ensureOrdersLoaded$ = defer(() =>
    this.orderService.ensureAllOrdersLoaded().pipe(
      map(() => true),
      startWith(false),
      catchError(() => {
        this.notificationService.warning(
          'Unable to load orders right now. Please try again.',
        );
        return of(false);
      }),
    ),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly ordersState$: Observable<LoadingState<AdminOrderRow[]>> =
    combineLatest([
      this.ensureOrdersLoaded$,
      this.orderService.allOrdersLoading$,
      this.orderService.allOrders$,
      this.updatingOrderIdsSubject.asObservable(),
    ]).pipe(
      map(([, loading, orders, updatingOrderIds]) => ({
        loading,
        data: orders.map((order) => ({
          ...order,
          isUpdating: updatingOrderIds.includes(order._id),
          userName:
            typeof order.user === 'string'
              ? 'N/A'
              : order.user.name || 'N/A',
        })),
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  protected readonly statuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'preparing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  constructor(
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
  ) {}

  updateStatus(order: AdminOrderRow, status: OrderStatus): void {
    if (order.isUpdating || order.status === status) {
      return;
    }

    this.setOrderUpdating(order._id, true);
    this.orderService
      .updateOrderStatus(order._id, status)
      .pipe(
        finalize(() => this.setOrderUpdating(order._id, false)),
        take(1),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Order status updated.');
        },
        error: () => {
          this.notificationService.warning(
            'Unable to update order status right now. Please try again.',
          );
        },
      });
  }

  private setOrderUpdating(orderId: string, isUpdating: boolean): void {
    const current = this.updatingOrderIdsSubject.value;
    const next = isUpdating
      ? [...current, orderId]
      : current.filter((id) => id !== orderId);

    this.updatingOrderIdsSubject.next([...new Set(next)]);
  }
}
