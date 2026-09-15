import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import { Router } from '@angular/router';

import {
  NotificationsService,
  Notification
} from '../../services/notifications';

@Component({
  imports: [CommonModule],
  selector: 'app-notifications',
  styleUrl: './notifications.css',
  templateUrl: './notifications.html',
})
export class Notifications implements OnInit {

  notifications = signal<Notification[]>([]);

  private platformId = inject(PLATFORM_ID);

  constructor(
    private notificationsService: NotificationsService,
    private router: Router
  ) {}

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {

      this.notificationsService.getNotifications().subscribe({

        next: (data) => {

          this.notifications.set(data);

          console.log(
            'Notifications page loaded:',
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

  markAsRead(notification: Notification) {

    if (notification.isRead) {
      return;
    }

    this.notificationsService.markAsRead(notification.id).subscribe({

      next: () => {

        notification.isRead = true;

        this.notifications.set([
          ...this.notifications()
        ]);

        console.log(
          `Notification #${notification.id} marked as read.`
        );

      },

      error: (error) => {

        console.error(
          'Failed to mark notification as read:',
          error
        );

      }

    });

  }

  markAllAsRead() {

    this.notificationsService.markAllAsRead().subscribe({

      next: () => {

        this.notifications.set(
          this.notifications().map(notification => ({
            ...notification,
            isRead: true
          }))
        );

        console.log(
          'All notifications marked as read.'
        );

      },

      error: (error) => {

        console.error(
          'Failed to mark all notifications as read:',
          error
        );

      }

    });

  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

}