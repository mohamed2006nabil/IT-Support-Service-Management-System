import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {

  const token = localStorage.getItem('token');

  if (token) {
    return true;
  }

  window.location.href = '/';

  return false;
};