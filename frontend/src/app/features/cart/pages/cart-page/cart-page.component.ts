import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
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
import { Cart } from '../../../../core/models/api.models';
import { CartService } from '../../../../core/services/cart.service';
import { NotificationService } from '../../../../core/services/notification.service';

type LoadingState<T> = {
  loading: boolean;
  data: T;
};

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  protected busy = false;
  private readonly emptyCart: Cart = {
    user: '',
    cartItems: [],
    totalPrice: 0,
  };
  private readonly ensureCartLoaded$ = defer(() =>
    this.cartService.ensureCartLoaded().pipe(
      map(() => true),
      startWith(false),
      catchError(() => {
        this.notificationService.warning(
          'Unable to load your cart right now. Please try again.',
        );
        return of(false);
      }),
    ),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  protected readonly cartState$: Observable<LoadingState<Cart>> =
    combineLatest([
      this.ensureCartLoaded$,
      this.cartService.cartLoading$,
      this.cartService.cart$,
    ]).pipe(
      map(([, loading, cart]) => ({
        loading,
        data: cart ?? this.emptyCart,
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  constructor(
    private readonly cartService: CartService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
  ) {}

  trackByMeal(index: number, item: any) {
    return item.meal._id;
  }

  updateQuantity(mealId: string, quantity: string): void {
    const parsed = Number(quantity);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return;
    }
    this.busy = true;
    this.cartService
      .updateQuantity(mealId, parsed)
      .pipe(
        finalize(() => {
          this.busy = false;
        }),
        take(1),
      )
      .subscribe();
  }

  removeItem(mealId: string): void {
    this.busy = true;
    this.cartService
      .removeItem(mealId)
      .pipe(
        finalize(() => {
          this.busy = false;
        }),
        take(1),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Meal removed from cart.');
        },
      });
  }

  clearCart(): void {
    this.busy = true;
    this.cartService
      .clearCart()
      .pipe(
        finalize(() => {
          this.busy = false;
        }),
        take(1),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Cart cleared.');
        },
      });
  }

  checkout(): void {
    this.router.navigate(['/orders/checkout']);
  }
}
