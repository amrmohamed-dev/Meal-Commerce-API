import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import {
  Observable,
  catchError,
  map,
  of,
  shareReplay,
  startWith,
  take,
} from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { OrderService } from './core/services/order.service';
import { UserService } from './core/services/user.service';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...SHARED_IMPORTS, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly isLoading$: Observable<boolean> = this.authService
    .bootstrapSession()
    .pipe(
      map(() => false),
      startWith(true),
      catchError(() => of(false)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  constructor(
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly userService: UserService,
  ) {
    this.authService.userId$.subscribe((userId) => {
      if (!userId) {
        return;
      }

      this.cartService.ensureCartLoaded().pipe(take(1)).subscribe({
        error: () => undefined,
      });
      this.orderService.ensureMyOrdersLoaded().pipe(take(1)).subscribe({
        error: () => undefined,
      });
      this.userService.ensureFavouritesLoaded().pipe(take(1)).subscribe({
        error: () => undefined,
      });
    });
  }
}
