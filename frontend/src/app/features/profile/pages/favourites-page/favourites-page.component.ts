import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import {
  Observable,
  catchError,
  combineLatest,
  defer,
  map,
  of,
  shareReplay,
  startWith,
} from 'rxjs';
import { Meal } from '../../../../core/models/api.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserService } from '../../../../core/services/user.service';
import { MealCardComponent } from '../../../../shared/components/meal-card/meal-card.component';

type LoadingState<T> = {
  loading: boolean;
  data: T;
};

@Component({
  selector: 'app-favourites-page',
  standalone: true,
  imports: [...SHARED_IMPORTS, MealCardComponent],
  templateUrl: './favourites-page.component.html',
  styleUrl: './favourites-page.component.scss',
})
export class FavouritesPageComponent {
  private readonly ensureFavouritesLoaded$ = defer(() =>
    this.userService.ensureFavouritesLoaded().pipe(
      map(() => true),
      startWith(false),
      catchError(() => {
        this.notificationService.warning(
          'Unable to load favourites right now. Please try again.',
        );
        return of(false);
      }),
    ),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly mealsState$: Observable<LoadingState<Meal[]>> = combineLatest(
    [
      this.ensureFavouritesLoaded$,
      this.userService.favouriteMealsLoading$,
      this.userService.favouriteMeals$,
    ],
  ).pipe(
    map(([, loading, favourites]) => ({
      loading,
      data: favourites
        .map((fav) => fav.meal)
        .filter((meal): meal is Meal => this.isMealObject(meal)),
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  private isMealObject(meal: Meal | string): meal is Meal {
    return typeof meal === 'object' && meal !== null && typeof meal._id === 'string';
  }
}
