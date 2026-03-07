import { Routes } from '@angular/router';

export const MEALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/meals-list-page/meals-list-page.component').then(
        (m) => m.MealsListPageComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/meal-details-page/meal-details-page.component').then(
        (m) => m.MealDetailsPageComponent,
      ),
  },
];
