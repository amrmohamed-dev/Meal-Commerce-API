import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Observable,
  catchError,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
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
  selector: 'app-meals-list-page',
  standalone: true,
  imports: [...SHARED_IMPORTS, MealCardComponent],
  templateUrl: './meals-list-page.component.html',
  styleUrl: './meals-list-page.component.scss',
})
export class MealsListPageComponent {
  protected readonly selectedCategory$: Observable<string> =
    this.route.queryParamMap.pipe(
      map(
        (params) =>
          params.get('categoryId') ?? params.get('category') ?? '',
      ),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  protected readonly categoriesState$: Observable<LoadingState<Category[]>> =
    this.categoryService.getCategories().pipe(
      map((categories) => ({ loading: false, data: categories })),
      startWith({ loading: true, data: [] as Category[] }),
      catchError(() => {
        this.notificationService.warning(
          'Unable to load categories right now. Please try again.',
        );
        return of({ loading: false, data: [] as Category[] });
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  protected readonly mealsState$: Observable<LoadingState<Meal[]>> =
    this.selectedCategory$.pipe(
      switchMap((categoryId) =>
        this.mealService.getMeals(categoryId || undefined).pipe(
          map((meals) => ({ loading: false, data: meals })),
          startWith({ loading: true, data: [] as Meal[] }),
          catchError(() => {
            this.notificationService.warning(
              'Unable to load meals right now. Please try again.',
            );
            return of({ loading: false, data: [] as Meal[] });
          }),
        ),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  constructor(
    private readonly mealService: MealService,
    private readonly categoryService: CategoryService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly notificationService: NotificationService,
  ) {}

  onCategoryChange(categoryId: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categoryId: categoryId || null,
        category: null,
      },
      queryParamsHandling: 'merge',
    });
  }
}


