import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, startWith } from 'rxjs';
import { Category, Meal } from '../../../../core/models/api.models';
import { CategoryService } from '../../../../core/services/category.service';
import { MealService } from '../../../../core/services/meal.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MealCardComponent } from '../../../../shared/components/meal-card/meal-card.component';

type LoadingState<T> = {
  loading: boolean;
  data: T;
};

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [...SHARED_IMPORTS, MealCardComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  protected readonly categories$: Observable<Category[]> =
    this.categoryService.getCategories().pipe(
      catchError(() => {
        this.notificationService.warning(
          'Unable to load categories right now. Please try again.',
        );
        return of([] as Category[]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  protected readonly featuredMealsState$: Observable<LoadingState<Meal[]>> =
    this.mealService.getMeals().pipe(
      map((meals) => ({
        loading: false,
        data: meals.slice(0, 6),
      })),
      startWith({ loading: true, data: [] as Meal[] }),
      catchError(() => {
        this.notificationService.warning(
          'Unable to load featured meals right now. Please try again.',
        );
        return of({ loading: false, data: [] as Meal[] });
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  constructor(
    private readonly categoryService: CategoryService,
    private readonly mealService: MealService,
    private readonly notificationService: NotificationService,
  ) {}
}
