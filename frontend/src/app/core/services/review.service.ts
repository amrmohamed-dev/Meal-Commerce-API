import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiResponse, Review } from '../models/api.models';

type ReviewPayload = {
  mealId: string;
  rating: number;
  comment: string;
};

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly apiPrefix = '/api/v1/reviews';
  private readonly reviewsSubject = new BehaviorSubject<Review[]>([]);
  readonly reviews$ = this.reviewsSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getReviews(mealId?: string): Observable<Review[]> {
    const params = mealId ? { mealId } : undefined;
    return this.http
      .get<ApiResponse<{ reviews: Review[] }>>(this.apiPrefix, { params })
      .pipe(
        map((res) => this.pick(res.data?.reviews, 'reviews')),
        tap((reviews) => this.reviewsSubject.next(reviews)),
      );
  }

  getReviewById(id: string): Observable<Review> {
    return this.http
      .get<ApiResponse<{ review: Review }>>(`${this.apiPrefix}/${id}`)
      .pipe(map((res) => this.pick(res.data?.review, 'review')));
  }

  createReview(payload: ReviewPayload): Observable<Review> {
    return this.http
      .post<ApiResponse<{ review: Review }>>(this.apiPrefix, payload)
      .pipe(
        map((res) => this.pick(res.data?.review, 'review')),
        tap((review) => {
          const current = this.reviewsSubject.value;
          this.reviewsSubject.next([...current, review]);
        }),
      );
  }

  updateReview(id: string, payload: Partial<ReviewPayload>): Observable<Review> {
    return this.http
      .patch<ApiResponse<{ review: Review }>>(`${this.apiPrefix}/${id}`, payload)
      .pipe(
        map((res) => this.pick(res.data?.review, 'review')),
        tap((review) => {
          const current = this.reviewsSubject.value;
          const updated = current.map((r) => (r._id === id ? review : r));
          this.reviewsSubject.next(updated);
        }),
      );
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiPrefix}/${id}`).pipe(
      tap(() => {
        const current = this.reviewsSubject.value;
        this.reviewsSubject.next(current.filter((r) => r._id !== id));
      }),
    );
  }

  private pick<T>(value: T | undefined, key: string): T {
    if (value === undefined || value === null) {
      throw new Error(`Malformed response: missing ${key}`);
    }
    return value;
  }
}
