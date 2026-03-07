import { Routes } from '@angular/router';
import { AdminGuard } from './core/guards/admin.guard';
import { AuthGuard } from './core/guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () =>
      import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'meals',
    loadChildren: () =>
      import('./features/meals/meals.routes').then((m) => m.MEALS_ROUTES),
  },
  {
    path: 'cart',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
  },
  {
    path: 'orders',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
  },
  {
    path: 'reviews',
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () =>
      import('./features/reviews/reviews.routes').then((m) => m.REVIEWS_ROUTES),
  },
  {
    path: 'favourites',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/profile/pages/favourites-page/favourites-page.component').then(
        (m) => m.FavouritesPageComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found-page.component').then(
        (m) => m.NotFoundPageComponent,
      ),
  },
];
