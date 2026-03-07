import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Meal, Review, User } from '../../../../core/models/api.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReviewService } from '../../../../core/services/review.service';

@Component({
  selector: 'app-reviews-list-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './reviews-list-page.component.html',
  styleUrl: './reviews-list-page.component.scss',
})
export class ReviewsListPageComponent implements OnInit {
  protected loading = true;
  protected busy = false;
  protected reviews: Review[] = [];

  constructor(
    private readonly reviewService: ReviewService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  deleteReview(id: string): void {
    this.busy = true;
    this.reviewService.deleteReview(id).subscribe({
      next: () => {
        this.notificationService.success('Review deleted.');
        this.loadReviews();
      },
      error: () => {
        this.busy = false;
      },
      complete: () => {
        this.busy = false;
      },
    });
  }

  private loadReviews(): void {
    this.loading = true;
    this.reviewService.getReviews().subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  protected getReviewUserName(review: Review): string {
    if (this.isUserObject(review.user)) {
      return review.user.name;
    }
    return 'Unknown user';
  }

  protected getReviewUserImage(review: Review): string {
    if (this.isUserObject(review.user)) {
      return review.user.image?.url ?? 'https://placehold.co/40x40?text=U';
    }
    return 'https://placehold.co/40x40?text=U';
  }

  protected getReviewMealName(review: Review): string {
    if (this.isMealObject(review.meal)) {
      return review.meal.name;
    }
    return 'Meal details unavailable';
  }

  protected getReviewMealId(review: Review): string | null {
    if (this.isMealObject(review.meal)) {
      return review.meal._id;
    }
    if (typeof review.meal === 'string') {
      return review.meal;
    }
    return null;
  }

  private isUserObject(user: Review['user']): user is User {
    return typeof user === 'object' && user !== null && typeof user._id === 'string';
  }

  private isMealObject(meal: Review['meal']): meal is Meal {
    return typeof meal === 'object' && meal !== null && typeof meal._id === 'string';
  }
}



