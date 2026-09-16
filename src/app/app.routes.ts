import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login').then(m => m.Login),
  },

  // administrador
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMINISTRATION'])],
    loadComponent: () =>
      import('./features/admin/admin').then(m => m.Admin),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/pages/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/pages/users/users').then(m => m.Users),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // comprador
  {
    path: 'purchasing',
    canActivate: [authGuard, roleGuard(['PURCHASING'])],
    loadComponent: () =>
      import('./features/purchasing/purchasing').then(m => m.Purchasing),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/purchasing/pages/dashboard').then(m => m.Dashboard),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // inventario
  {
    path: 'inventory',
    canActivate: [authGuard, roleGuard(['INVENTORY'])],
    loadComponent: () =>
      import('./features/inventory/inventory').then(m => m.Inventory),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/inventory/pages/dashboard').then(m => m.Dashboard),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // vendedor
  {
    path: 'sales',
    canActivate: [authGuard, roleGuard(['SALES'])],
    loadComponent: () =>
      import('./features/sales/sales').then(m => m.Sales),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/sales/pages/dashboard').then(m => m.Dashboard),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];