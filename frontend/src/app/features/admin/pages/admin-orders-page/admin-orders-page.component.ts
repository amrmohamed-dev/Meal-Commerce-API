import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component, OnInit } from '@angular/core';
import { catchError, of, take } from 'rxjs';
import { Order, OrderStatus } from '../../../../core/models/api.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-admin-orders-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
})
export class AdminOrdersPageComponent implements OnInit {
  protected readonly orders$ = this.orderService.allOrders$;
  protected readonly loading$ = this.orderService.allOrdersLoading$;

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

  ngOnInit(): void {
    this.orderService
      .ensureAllOrdersLoaded()
      .pipe(
        catchError(() => {
          this.notificationService.warning(
            'Unable to load orders right now. Please try again.',
          );
          return of([] as Order[]);
        }),
        take(1),
      )
      .subscribe();
  }

  updateStatus(orderId: string, status: OrderStatus): void {
    this.orderService
      .updateOrderStatus(orderId, status)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.notificationService.success('Order status updated.');
        },
      });
  }
}



