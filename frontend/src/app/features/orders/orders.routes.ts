import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout-page/checkout-page.component').then(
        (m) => m.CheckoutPageComponent,
      ),
  },
  {
    path: 'my-orders',
    loadComponent: () =>
      import('./pages/my-orders-page/my-orders-page.component').then(
        (m) => m.MyOrdersPageComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/order-details-page/order-details-page.component').then(
        (m) => m.OrderDetailsPageComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'my-orders',
  },
];
