import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/admin-dashboard-page/admin-dashboard-page.component').then(
        (m) => m.AdminDashboardPageComponent,
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/admin-users-page/admin-users-page.component').then(
        (m) => m.AdminUsersPageComponent,
      ),
  },
  {
    path: 'reviews',
    loadComponent: () =>
      import('../reviews/pages/reviews-list-page/reviews-list-page.component').then(
        (m) => m.ReviewsListPageComponent,
      ),
  },
  {
    path: 'meals',
    loadComponent: () =>
      import('./pages/admin-meals-page/admin-meals-page.component').then(
        (m) => m.AdminMealsPageComponent,
      ),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/admin-categories-page/admin-categories-page.component').then(
        (m) => m.AdminCategoriesPageComponent,
      ),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/admin-orders-page/admin-orders-page.component').then(
        (m) => m.AdminOrdersPageComponent,
      ),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./pages/admin-stats-page/admin-stats-page.component').then(
        (m) => m.AdminStatsPageComponent,
      ),
  },
];
