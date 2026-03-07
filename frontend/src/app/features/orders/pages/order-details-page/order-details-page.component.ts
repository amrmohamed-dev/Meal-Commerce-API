import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Observable,
  Subject,
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { Order } from '../../../../core/models/api.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { OrderService } from '../../../../core/services/order.service';

type LoadingState<T> = {
  loading: boolean;
  data: T;
};

@Component({
  selector: 'app-order-details-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './order-details-page.component.html',
  styleUrl: './order-details-page.component.scss',
})
export class OrderDetailsPageComponent {
  protected busy = false;
  private readonly refreshOrder$ = new Subject<void>();
  protected readonly orderState$: Observable<LoadingState<Order | null>> =
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      distinctUntilChanged(),
      switchMap((id) => {
        if (!id) {
          return of({ loading: false, data: null });
        }

        return this.refreshOrder$.pipe(
          startWith(void 0),
          switchMap(() =>
            this.orderService.getOrderById(id).pipe(
              map((order) => ({ loading: false, data: order })),
              startWith({ loading: true, data: null }),
              catchError(() => {
                this.notificationService.warning(
                  'Unable to load order details right now. Please try again.',
                );
                return of({ loading: false, data: null });
              }),
            ),
          ),
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
  ) {}

  cancelOrder(orderId: string): void {
    this.busy = true;
    this.orderService
      .cancelOrder(orderId)
      .pipe(
        finalize(() => {
          this.busy = false;
        }),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Order cancelled successfully.');
          this.refreshOrder$.next();
        },
      });
  }

  canCancel(status: string): boolean {
    return status === 'pending' || status === 'confirmed';
  }
}



