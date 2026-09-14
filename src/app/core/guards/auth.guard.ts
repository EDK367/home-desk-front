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
  const router = inject(Router);

  if (!tokenService.hasToken()) {
    return true;
  }

  // si tiene token lo manda a la pagina, tiene que hacer  logout
  return router.createUrlTree(['/']);
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const role = inject(SessionService).getRole();
  const router = inject(Router);

  if (role && allowedRoles.includes(role)) {
    return true;
  }

  return router.createUrlTree(['/']);
};
