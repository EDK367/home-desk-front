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
        path: 'roles',
        loadComponent: () =>
          import('./features/admin/pages/roles/roles').then(m => m.Roles),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/pages/products/products').then(m => m.Products),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/pages/categories/categories').then(m => m.Categories),
      },
      {
        path: 'payment-methods',
        loadComponent: () =>
          import('./features/admin/pages/payment-methods/payment-methods').then(m => m.PaymentMethods),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/admin/pages/customers/customers').then(m => m.Customers),
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/admin/pages/suppliers/suppliers').then(m => m.Suppliers),
      },
      {
        path: 'purchases',
        loadComponent: () =>
          import('./features/admin/pages/purchases/purchases').then(m => m.Purchases),
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./features/admin/pages/sales/sales').then(m => m.Sales),
      },
      {
        path: 'inventory',
        children: [
          {
            path: 'stock',
            loadComponent: () =>
              import('./features/admin/pages/inventory/stock/stock').then(m => m.AdminStock),
          },
          {
            path: 'movements',
            loadComponent: () =>
              import('./features/admin/pages/inventory/movements/movements').then(m => m.AdminMovements),
          },
          {
            path: 'lots',
            loadComponent: () =>
              import('./features/admin/pages/inventory/lots/lots').then(m => m.AdminLots),
          },
          {
            path: '',
            redirectTo: 'stock',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'stock',
        redirectTo: 'inventory/stock',
        pathMatch: 'full'
      },
      {
        path: 'movements',
        redirectTo: 'inventory/movements',
        pathMatch: 'full'
      },
      {
        path: 'lots',
        redirectTo: 'inventory/lots',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/admin/pages/profile/profile').then(m => m.Profile),
      },
      {
        path: 'perfil',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/admin/pages/audit-logs/audit-logs').then(m => m.AuditLogs),
      },
      {
        path: 'auditoria',
        redirectTo: 'audit-logs',
        pathMatch: 'full'
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
        path: 'purchases',
        loadComponent: () =>
          import('./features/purchasing/pages/purchases/purchases').then(m => m.Purchases),
      },
      {
        path: 'new-purchase',
        redirectTo: 'purchases',
        pathMatch: 'full'
      },
      {
        path: 'providers',
        loadComponent: () =>
          import('./features/purchasing/pages/providers/providers').then(m => m.Providers),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/purchasing/pages/products/products').then(m => m.Products),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/purchasing/pages/profile/profile').then(m => m.Profile),
      },
      {
        path: 'perfil',
        redirectTo: 'profile',
        pathMatch: 'full'
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
        path: 'stock',
        loadComponent: () =>
          import('./features/inventory/pages/stock/stock').then(m => m.Stock),
      },
      {
        path: 'movements',
        loadComponent: () =>
          import('./features/inventory/pages/movements/movements').then(m => m.Movements),
      },
      {
        path: 'lots',
        loadComponent: () =>
          import('./features/inventory/pages/lots/lots').then(m => m.Lots),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/inventory/pages/products/products').then(m => m.Products),
      },
      {
        path: 'new-product',
        redirectTo: 'products',
        pathMatch: 'full'
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/inventory/pages/categories/categories').then(m => m.Categories),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/inventory/pages/profile/profile').then(m => m.Profile),
      },
      {
        path: 'perfil',
        redirectTo: 'profile',
        pathMatch: 'full'
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
        path: 'sales',
        loadComponent: () =>
          import('./features/sales/pages/sales/sales').then(m => m.SalesList),
      },
      {
        path: 'new-sale',
        redirectTo: 'sales',
        pathMatch: 'full'
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/sales/pages/clients/clients').then(m => m.Clients),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/sales/pages/profile/profile').then(m => m.Profile),
      },
      {
        path: 'perfil',
        redirectTo: 'profile',
        pathMatch: 'full'
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