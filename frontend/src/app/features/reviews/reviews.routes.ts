import { Routes } from '@angular/router';

export const REVIEWS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reviews-list-page/reviews-list-page.component').then(
        (m) => m.ReviewsListPageComponent,
      ),
  },
];
