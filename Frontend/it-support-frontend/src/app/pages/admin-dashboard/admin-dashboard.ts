import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  DashboardService,
  DashboardSummary
} from '../../services/dashboard';

import { UsersService } from '../../services/users';

interface DashboardUser {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  profileImagePath: string | null;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);
  readonly usersService = inject(UsersService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  user: DashboardUser | null = null;
  dashboard: DashboardSummary | null = null;

  isLoading = true;
  errorMessage = '';
  lastUpdated = this.formatLastUpdated(new Date());

  isProfileMenuOpen = false;
  profileImageLoadFailed = false;

  ngOnInit(): void {
    this.loadUser();
    this.loadDashboard();
  }

  private loadUser(): void {
    const userData = localStorage.getItem('user');

    if (!userData) {
      return;
    }

    try {
      this.user = JSON.parse(userData) as DashboardUser;
      this.profileImageLoadFailed = false;
    } catch {
      this.user = null;
      this.profileImageLoadFailed = false;
    }
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getSummary().subscribe({
      next: (data: DashboardSummary) => {
        this.dashboard = data;
        this.lastUpdated = this.formatLastUpdated(new Date());
        this.isLoading = false;
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.errorMessage =
          'Unable to load dashboard data. Please try again.';
        this.isLoading = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  getProfileImageUrl(): string | null {
    if (!this.user?.profileImagePath || this.profileImageLoadFailed) {
      return null;
    }

    return this.usersService.getProfileImageUrl(this.user.profileImagePath);
  }

  handleProfileImageError(): void {
    this.profileImageLoadFailed = true;
  }

  goToAdminProfile(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/admin/profile']);
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }

  private formatLastUpdated(date: Date): string {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  retryLoadDashboard(): void {
    this.loadDashboard();
  }

  goToAdminUsers(): void {
    this.router.navigate(['/admin-users']);
  }

  goToAdminTickets(): void {
    this.router.navigate(['/admin-tickets']);
  }

  goToAdminCategories(): void {
    this.router.navigate(['/admin-categories']);
  }

  goToAdminPriorities(): void {
    this.router.navigate(['/admin-priorities']);
  }

  goToAdminDepartments(): void {
    this.router.navigate(['/admin-departments']);
  }

  goToAdminTicketHistory(): void {
    this.router.navigate(['/admin-ticket-history']);
  }

  logout(): void {
    this.isProfileMenuOpen = false;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.router.navigate(['/']);
  }
}
