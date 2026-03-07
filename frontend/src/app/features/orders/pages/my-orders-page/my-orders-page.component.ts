import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import {
  Observable,
  catchError,
  combineLatest,
  defer,
  map,
  of,
  shareReplay,
  startWith,
} from 'rxjs';
import { Order } from '../../../../core/models/api.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { OrderService } from '../../../../core/services/order.service';

type LoadingState<T> = {
  loading: boolean;
  data: T;
};

@Component({
  selector: 'app-my-orders-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './my-orders-page.component.html',
  styleUrl: './my-orders-page.component.scss',
})
export class MyOrdersPageComponent {
  private readonly ensureOrdersLoaded$ = defer(() =>
    this.orderService.ensureMyOrdersLoaded().pipe(
      map(() => true),
      startWith(false),
      catchError(() => {
        this.notificationService.warning(
          'Unable to load your orders right now. Please try again.',
        );
        return of(false);
      }),
    ),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly ordersState$: Observable<LoadingState<Order[]>> =
    combineLatest([
      this.ensureOrdersLoaded$,
      this.orderService.myOrdersLoading$,
      this.orderService.myOrders$,
    ]).pipe(
      map(([, loading, orders]) => ({ loading, data: orders })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  constructor(
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
  ) {}
}



