import { CanActivateFn } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {

  const userData = localStorage.getItem('user');

  if (!userData) {
    window.location.href = '/';
    return false;
  }

  const user = JSON.parse(userData);

  const requiredRole = route.data['role'];

  if (user.role === requiredRole) {
    return true;
  }

  window.location.href = '/';

  return false;
};