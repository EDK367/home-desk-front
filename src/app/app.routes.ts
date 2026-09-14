import { Routes } from '@angular/router';

import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login').then(m => m.Login),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMINISTRATION'])],
    loadComponent: () =>
      import('./features/admin/pages/dashboard').then(m => m.Dashboard),
  },
  {
    path: 'purchasing',
    canActivate: [authGuard, roleGuard(['PURCHASING'])],
    loadComponent: () =>
      import('./features/purchasing/pages/dashboard').then(m => m.Dashboard),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login').then(m => m.Login),
  },
  {
    path: '**',
    redirectTo: '',
  },
];