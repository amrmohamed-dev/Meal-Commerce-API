import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile-page/profile-page.component').then(
        (m) => m.ProfilePageComponent,
      ),
  },
  {
    path: 'update-password',
    loadComponent: () =>
      import('./pages/update-password-page/update-password-page.component').then(
        (m) => m.UpdatePasswordPageComponent,
      ),
  },
];
