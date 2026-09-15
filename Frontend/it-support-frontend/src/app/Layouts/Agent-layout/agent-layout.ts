import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  Router,
  RouterOutlet
} from '@angular/router';

import { UsersService } from '../../services/users';

interface AgentUser {
  userId?: number;
  fullName?: string;
  email?: string;
  role?: string;
  profileImagePath?: string | null;
}

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './agent-layout.html',
  styleUrl: './agent-layout.css'
})
export class AgentLayout implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly usersService = inject(UsersService);

  user: AgentUser | null = null;
  isProfileMenuOpen = false;
  profileImageLoadFailed = false;

  constructor(
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadUser();
  }

  private loadUser(): void {
    const userData = localStorage.getItem('user');

    if (!userData) {
      return;
    }

    try {
      this.user = JSON.parse(userData) as AgentUser;
      this.profileImageLoadFailed = false;
    } catch {
      this.user = null;
    }
  }

  userInitial(): string {
    const name = this.user?.fullName?.trim();

    if (!name) {
      return 'A';
    }

    return name.charAt(0).toUpperCase();
  }

  getProfileImageUrl(): string | null {
    const imagePath = this.user?.profileImagePath;

    if (!imagePath || this.profileImageLoadFailed) {
      return null;
    }

    return this.usersService.getProfileImageUrl(imagePath);
  }

  handleProfileImageError(): void {
    this.profileImageLoadFailed = true;
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  isRouteActive(path: string): boolean {
    return (
      this.router.url === path ||
      this.router.url.startsWith(`${path}/`)
    );
  }

  goToDashboard(): void {
    this.closeProfileMenu();
    this.router.navigate(['/agent-dashboard']);
  }

  goToAgentTickets(): void {
    this.closeProfileMenu();
    this.router.navigate(['/agent-tickets']);
  }

  goToAgentNotifications(): void {
    this.closeProfileMenu();
    this.router.navigate(['/agent-notifications']);
  }

  goToAgentTicketHistory(): void {
    this.closeProfileMenu();
    this.router.navigate(['/agent-ticket-history']);
  }

  goToAgentProfile(): void {
    this.closeProfileMenu();
    this.router.navigate(['/agent-profile']);
  }

  logout(): void {
    this.closeProfileMenu();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/']);
  }
}
