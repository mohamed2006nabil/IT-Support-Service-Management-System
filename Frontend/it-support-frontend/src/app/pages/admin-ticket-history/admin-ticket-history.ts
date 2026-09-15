import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
  computed
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users';

export interface AdminTicketHistoryItem {
  id: number;
  ticketId: number;
  userId: number;
  userName: string;
  oldStatusId: number | null;
  oldStatusName: string | null;
  newStatusId: number | null;
  newStatusName: string | null;
  action: string;
  notes: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-admin-ticket-history',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-ticket-history.html',
  styleUrl: './admin-ticket-history.css'
})
export class AdminTicketHistory implements OnInit {
  private platformId = inject(PLATFORM_ID);
  readonly usersService = inject(UsersService);

  private apiUrl = 'http://localhost:5058/api/tickethistory';

  history = signal<AdminTicketHistoryItem[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  ticketFilter = signal('');
  actionFilter = signal('');

  selectedHistory = signal<AdminTicketHistoryItem | null>(null);
  showDetailsModal = signal(false);

  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  pageSize = 8;
  currentPage = signal(1);

  adminUser = signal<{
    fullName: string;
    role: string;
    profileImagePath: string | null;
  }>({
    fullName: 'Administrator',
    role: 'Admin',
    profileImagePath: null
  });

  profileImageLoadFailed = false;
  isProfileMenuOpen = false;
  lastUpdated = signal<string | null>(null);

  availableActions = computed(() => [
    ...new Set(
      this.history()
        .map(item => item.action)
        .filter(action => !!action)
    )
  ]);

  filteredHistory = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const ticket = this.ticketFilter().trim();
    const action = this.actionFilter().trim().toLowerCase();

    return this.history().filter(item => {
      const matchesSearch =
        !search ||
        item.action.toLowerCase().includes(search) ||
        item.userName.toLowerCase().includes(search) ||
        (!!item.notes && item.notes.toLowerCase().includes(search)) ||
        item.ticketId.toString().includes(search);

      const matchesTicket =
        !ticket || item.ticketId.toString().includes(ticket);

      const matchesAction =
        !action || item.action.toLowerCase().includes(action);

      return matchesSearch && matchesTicket && matchesAction;
    });
  });

  totalActivities = computed(() => this.history().length);

  createdActivities = computed(() =>
    this.history().filter(item =>
      item.action.toLowerCase() === 'created'
    ).length
  );

  statusChanges = computed(() =>
    this.history().filter(item =>
      item.oldStatusName || item.newStatusName ||
      item.action.toLowerCase().includes('status')
    ).length
  );

  otherActivities = computed(() => Math.max(
    0,
    this.totalActivities() - this.createdActivities() - this.statusChanges()
  ));

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredHistory().length / this.pageSize))
  );

  pagedHistory = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredHistory().slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  pageStart = computed(() => {
    const count = this.filteredHistory().length;
    return count === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1;
  });

  pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.filteredHistory().length)
  );

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAdminUser();
      this.loadHistory();
    }
  }

  private loadAdminUser(): void {
    const userData = localStorage.getItem('user');
    if (!userData) return;

    try {
      const user = JSON.parse(userData);
      this.adminUser.set({
        fullName: user.fullName || 'Administrator',
        role: user.role || user.roleName || 'Admin',
        profileImagePath: user.profileImagePath || null
      });
      this.profileImageLoadFailed = false;
    } catch {
      this.adminUser.set({
        fullName: 'Administrator',
        role: 'Admin',
        profileImagePath: null
      });
      this.profileImageLoadFailed = false;
    }
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  getProfileImageUrl(): string | null {
    if (!this.adminUser().profileImagePath || this.profileImageLoadFailed) {
      return null;
    }

    return this.usersService.getProfileImageUrl(
      this.adminUser().profileImagePath!
    );
  }

  handleProfileImageError(): void {
    this.profileImageLoadFailed = true;
  }

  goToAdminProfile(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/admin/profile']);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadHistory(): void {
    this.loading.set(true);

    this.http
      .get<AdminTicketHistoryItem[]>(this.apiUrl, {
        headers: this.getHeaders()
      })
      .subscribe({
        next: data => {
          this.history.set(data);
          this.currentPage.set(1);
          this.lastUpdated.set(new Date().toISOString());
          this.loading.set(false);
        },
        error: error => {
          console.error('Failed to load ticket history:', error);
          this.loading.set(false);
          this.showMessage('Failed to load ticket history.', 'error');
        }
      });
  }

  refreshHistory(): void {
    this.loadHistory();
  }

  viewHistory(item: AdminTicketHistoryItem): void {
    this.selectedHistory.set(item);
    this.showDetailsModal.set(true);
  }

  closeDetails(): void {
    this.showDetailsModal.set(false);
    this.selectedHistory.set(null);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.ticketFilter.set('');
    this.actionFilter.set('');
    this.currentPage.set(1);
  }

  hasActiveFilters(): boolean {
    return !!this.searchTerm().trim() ||
      !!this.ticketFilter().trim() ||
      !!this.actionFilter().trim();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  goHome(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set(text);
    this.messageType.set(type);

    setTimeout(() => {
      this.message.set('');
    }, 4000);
  }

  formatDate(date: string | null): string {
    if (!date) return '—';

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return '—';

    return parsedDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionClass(action: string): string {
    const value = action.toLowerCase();
    if (value.includes('created')) return 'action-created';
    if (value.includes('status')) return 'action-status';
    if (value.includes('delete')) return 'action-danger';
    if (value.includes('update') || value.includes('edit')) return 'action-update';
    return 'action-default';
  }
}
