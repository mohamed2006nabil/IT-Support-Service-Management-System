import {
  Component,
  PLATFORM_ID,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

import {
  NotificationsService,
  Notification
} from '../../services/notifications';

@Component({
  imports: [],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {

  user: any = null;

  notifications = signal<Notification[]>([]);

  private platformId = inject(PLATFORM_ID);

  constructor(
    private router: Router,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {

      const userData = localStorage.getItem('user');

      if (userData) {
        this.user = JSON.parse(userData);
      }

      // Load Notifications
      this.notificationsService.getNotifications().subscribe({
        next: (data) => {

          this.notifications.set(data);

          console.log(
            'Notifications loaded:',
            data
          );

        },

        error: (error) => {

          console.error(
            'Failed to load notifications:',
            error
          );

        }
      });

    }

  }

  goToCreateTicket() {
    this.router.navigate(['/create-ticket']);
  }

  goToTickets() {
    this.router.navigate(['/tickets']);
  }

  goToNotifications() {
  this.router.navigate(['/notifications']);
}

logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  this.router.navigate(['/']);
}

}