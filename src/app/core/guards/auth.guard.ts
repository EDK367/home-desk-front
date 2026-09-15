import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { TokenService } from '../services/token';
import { SessionService } from '../services/session';

// guards para proteger las rutas, por el momento esta muy general
export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.hasToken()) {
    return true;
  }

  // si no existe lo manda a login
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (!tokenService.hasToken() || !sessionService.getUser()) {
    tokenService.clearTokens();
    sessionService.clearUser();
    return true;
  }

  // si tiene token lo manda a la pagina, tiene que hacer  logout
  const role = sessionService.getRole();
  if (role === 'PURCHASING') return router.createUrlTree(['/purchasing/dashboard']);
  if (role === 'INVENTORY') return router.createUrlTree(['/inventory/dashboard']);
  if (role === 'SALES') return router.createUrlTree(['/sales/dashboard']);
  return router.createUrlTree(['/admin/dashboard']);
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const role = inject(SessionService).getRole();
  const router = inject(Router);

  if (role && allowedRoles.includes(role)) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
