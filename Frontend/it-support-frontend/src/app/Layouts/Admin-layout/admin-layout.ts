import {
  Component,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  AuthService
} from '../../services/auth';


@Component({
  selector: 'app-admin-layout',

  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],

  templateUrl: './admin-layout.html',

  styleUrl: './admin-layout.css'
})
export class AdminLayout {

  private readonly authService =
    inject(AuthService);


  /*
   * Reactive reference to the authenticated user.
   *
   * This signal is updated automatically when
   * the profile information or profile photo changes.
   */
  user =
    this.authService.currentUser;


  logout(): void {

    this.authService.logout();

    window.location.href = '/';

  }

}