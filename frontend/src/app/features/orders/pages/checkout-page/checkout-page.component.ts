import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
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
import { OrderService } from '../../../../core/services/order.service';
import { extractErrorMessage } from '../../../../core/utils/http-error.util';

type LoadingState<T> = {
  loading: boolean;
  data: T;
};

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
})
export class CheckoutPageComponent {
  protected placing = false;
  protected formError: string | null = null;
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
          'Unable to load checkout details right now. Please try again.',
        );
        return of(false);
      }),
    ),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  protected readonly cartState$: Observable<LoadingState<Cart>> = combineLatest([
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

  protected readonly form = this.formBuilder.nonNullable.group({
    street: ['', [Validators.required, Validators.minLength(3)]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
  ) {}

  submit(): void {
    this.formError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Please correct the highlighted fields.';
      return;
    }

    const currentCart = this.cartService.cart ?? this.emptyCart;

    if (currentCart.cartItems.length === 0) {
      this.notificationService.error('Cart is empty.');
      return;
    }

    this.placing = true;
    this.orderService
      .createOrder(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.placing = false;
        }),
      )
      .subscribe({
        next: (order) => {
          this.cartService.refreshCart().pipe(take(1)).subscribe({
            error: () => undefined,
          });
          this.notificationService.success('Order placed successfully.');
          this.router.navigate(['/orders', order._id]);
        },
        error: (error: HttpErrorResponse) => {
          this.formError = extractErrorMessage(error);
        },
      });
  }

  protected get street() {
    return this.form.controls.street;
  }

  protected get city() {
    return this.form.controls.city;
  }

  protected get phone() {
    return this.form.controls.phone;
  }
}



