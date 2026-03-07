import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Observable,
  combineLatest,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
  Subject,
} from 'rxjs';
import { Meal, Review, User } from '../../../../core/models/api.models';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { MealService } from '../../../../core/services/meal.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserService } from '../../../../core/services/user.service';
import { ReviewService } from '@app/core/services/review.service';

type LoadingState<T> = {
  loading: boolean;
  data: T;
};

@Component({
  selector: 'app-meal-details-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './meal-details-page.component.html',
  styleUrl: './meal-details-page.component.scss',
})
export class MealDetailsPageComponent {
  protected busy = false;
  protected quantity = 1;
  protected showReviewForm = false;
  protected reviewRating = 5;
  protected reviewComment = '';
  protected editingReviewId: string | null = null;
  protected editingReviewRating = 5;
  protected editingReviewComment = '';
  private reviewRefresh$ = new Subject<void>();
  protected readonly mealState$: Observable<LoadingState<Meal | null>> =
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) => {
        if (!id) {
          this.router.navigate(['/meals']);
          return of({ loading: false, data: null });
        }

        return this.mealService.getMealById(id).pipe(
          map((meal) => ({ loading: false, data: meal })),
          startWith({ loading: true, data: null }),
          catchError(() => {
            this.notificationService.warning(
              'Unable to load meal details right now. Please try again.',
            );
            return of({ loading: false, data: null });
          }),
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  protected readonly reviews$: Observable<Review[]> = combineLatest([
    this.mealState$,
    this.reviewRefresh$.pipe(startWith(null)),
  ]).pipe(
    switchMap(([mealState]) => {
      const mealId = mealState.data?._id;

      if (!mealId) {
        return of([]);
      }

      return this.reviewService.getReviews(mealId);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  protected readonly isFavourite$ = combineLatest([
    this.mealState$,
    this.userService.favouriteMealIds$,
  ]).pipe(
    map(([mealState, favouriteMealIds]) => {
      const mealId = mealState.data?._id;
      return mealId ? favouriteMealIds.has(mealId) : false;
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly mealService: MealService,
    private readonly cartService: CartService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly reviewService: ReviewService,
  ) {}

  addToCart(meal: Meal): void {
    if (!this.authService.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.busy = true;
    this.cartService
      .addToCart(meal._id, this.quantity)
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

  toggleFavourite(meal: Meal): void {
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
          this.notificationService.success('Favourite meals updated.');
        },
      });
  }

  toggleReviewForm(): void {
    this.showReviewForm = !this.showReviewForm;
  }

  submitReview(meal: Meal): void {
    if (!this.authService.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const payload = {
      mealId: meal._id,
      rating: this.reviewRating,
      comment: this.reviewComment,
    };

    this.reviewService.createReview(payload).subscribe({
      next: () => {
        this.notificationService.success('Review added successfully');

        this.reviewComment = '';
        this.reviewRating = 5;
        this.showReviewForm = false;

        this.reviewRefresh$.next();
      },
    });
  }

  startReviewEdit(review: Review): void {
    if (!this.canUpdateReview(review)) {
      return;
    }

    this.editingReviewId = review._id;
    this.editingReviewRating = review.rating;
    this.editingReviewComment = review.comment;
  }

  cancelReviewEdit(): void {
    this.editingReviewId = null;
    this.editingReviewRating = 5;
    this.editingReviewComment = '';
  }

  updateReview(reviewId: string): void {
    if (this.editingReviewId !== reviewId || !this.authService.currentUser) {
      return;
    }

    const payload = {
      rating: this.editingReviewRating,
      comment: this.editingReviewComment.trim(),
    };

    this.busy = true;
    this.reviewService.updateReview(reviewId, payload).subscribe({
      next: () => {
        this.notificationService.success('Review updated successfully');
        this.cancelReviewEdit();
        this.reviewRefresh$.next();
      },
      error: () => {
        this.busy = false;
      },
      complete: () => {
        this.busy = false;
      },
    });
  }

  deleteReview(id: string): void {
    if (!this.authService.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.busy = true;
    this.reviewService.deleteReview(id).subscribe({
      next: () => {
        this.notificationService.success('Review deleted successfully');
        if (this.editingReviewId === id) {
          this.cancelReviewEdit();
        }

        this.reviewRefresh$.next();
      },
      error: () => {
        this.busy = false;
      },
      complete: () => {
        this.busy = false;
      },
    });
  }

  protected canUpdateReview(review: Review): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return false;
    }
    return this.getReviewUserId(review) === currentUser._id;
  }

  protected canDeleteReview(review: Review): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return false;
    }
    if (currentUser.role === 'admin') {
      return true;
    }
    return this.getReviewUserId(review) === currentUser._id;
  }

  protected getReviewUserName(review: Review): string {
    if (this.isUserObject(review.user)) {
      return review.user.name;
    }
    return 'User';
  }

  protected getReviewUserImage(review: Review): string {
    if (this.isUserObject(review.user)) {
      return review.user.image?.url ?? 'https://placehold.co/40x40?text=U';
    }
    return 'https://placehold.co/40x40?text=U';
  }

  private getReviewUserId(review: Review): string | null {
    const { user } = review;
    if (typeof user === 'string') {
      return user;
    }
    if (this.isUserObject(user)) {
      return user._id;
    }
    return null;
  }

  private isUserObject(user: Review['user']): user is User {
    return typeof user === 'object' && user !== null && typeof user._id === 'string';
  }
}
