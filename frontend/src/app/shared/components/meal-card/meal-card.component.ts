import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, finalize, of, switchMap, take } from 'rxjs';
import { Meal } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-meal-card',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './meal-card.component.html',
  styleUrl: './meal-card.component.scss',
})
export class MealCardComponent {
  private readonly mealSubject = new BehaviorSubject<Meal | null>(null);
  private _meal!: Meal;

  @Input({ required: true })
  set meal(value: Meal) {
    this._meal = value;
    this.mealSubject.next(value);
  }

  get meal(): Meal {
    return this._meal;
  }

  protected busy = false;
  protected readonly isFavourite$ = this.mealSubject.pipe(
    switchMap((meal) =>
      meal ? this.userService.isMealFavourite$(meal._id) : of(false),
    ),
  );

  constructor(
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
  ) {}

  addToCart(): void {
    const meal = this.mealSubject.value;
    if (!meal) {
      return;
    }

    if (!this.authService.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.busy = true;
    this.cartService
      .addToCart(meal._id)
      .pipe(
        finalize(() => {
          this.busy = false;
        }),
        take(1),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Meal added to cart.');
        },
      });
  }

  toggleFavourite(): void {
    const meal = this.mealSubject.value;
    if (!meal) {
      return;
    }

    if (!this.authService.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.busy = true;
    this.userService
      .toggleFavourite(meal._id)
      .pipe(
        finalize(() => {
          this.busy = false;
        }),
        take(1),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Favourites updated.');
        },
      });
  }
}
