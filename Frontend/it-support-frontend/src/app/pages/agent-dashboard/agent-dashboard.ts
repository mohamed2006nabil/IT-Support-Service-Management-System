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

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Router } from '@angular/router';

interface AgentUser {
  userId?: number;
  fullName?: string;
  email?: string;
  role?: string;
  profileImagePath?: string | null;
}

interface AgentTicket {
  id: number;
  title: string;
  description: string;
  userId: number;
  userName: string;
  assignedToId: number | null;
  assignedToName: string | null;
  categoryId: number;
  categoryName: string;
  priorityId: number;
  priorityName: string;
  statusId: number;
  statusName: string;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-dashboard.html',
  styleUrl: './agent-dashboard.css'
})
export class AgentDashboard implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly apiUrl =
    'http://localhost:5058/api/tickets';

  user: AgentUser | null = null;

  tickets = signal<AgentTicket[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  totalAssigned = computed(() => this.tickets().length);

  openCount = computed(() => this.countByStatus('open'));

  inProgressCount = computed(() =>
    this.countByStatus('in progress')
  );

  resolvedCount = computed(() =>
    this.countByStatus('resolved')
  );

  closedCount = computed(() =>
    this.countByStatus('closed')
  );

  recentTickets = computed(() =>
    [...this.tickets()]
      .sort((a, b) => this.ticketDate(b) - this.ticketDate(a))
      .slice(0, 5)
  );

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadUser();
    this.loadTickets();
  }

  private loadUser(): void {
    const userData = localStorage.getItem('user');

    if (!userData) {
      return;
    }

    try {
      this.user = JSON.parse(userData) as AgentUser;
    } catch {
      this.user = null;
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  loadTickets(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http
      .get<AgentTicket[]>(this.apiUrl, {
        headers: this.getHeaders()
      })
      .subscribe({
        next: (data) => {
          this.tickets.set(data || []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error(
            'Failed to load agent tickets:',
            error
          );

          this.tickets.set([]);
          this.loading.set(false);
          this.errorMessage.set(
            'Unable to load your assigned tickets.'
          );
        }
      });
  }

  refreshDashboard(): void {
    this.loadTickets();
  }

  private countByStatus(statusName: string): number {
    const target = statusName.trim().toLowerCase();

    return this.tickets().filter(ticket =>
      (ticket.statusName || '')
        .trim()
        .toLowerCase() === target
    ).length;
  }

  statusPercent(value: number): number {
    const total = this.totalAssigned();

    if (!total) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }

  private ticketDate(ticket: AgentTicket): number {
    const date = ticket.updatedAt || ticket.createdAt;
    const timestamp = new Date(date).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 18) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }

  firstName(): string {
    const name = this.user?.fullName?.trim();

    if (!name) {
      return 'there';
    }

    return name.split(/\s+/)[0];
  }

  goToAgentTickets(): void {
    this.router.navigate(['/agent-tickets']);
  }

  goToAgentNotifications(): void {
    this.router.navigate(['/agent-notifications']);
  }

  goToAgentTicketHistory(): void {
    this.router.navigate(['/agent-ticket-history']);
  }

  viewTicket(ticketId: number): void {
    this.router.navigate([
      '/agent-ticket-details',
      ticketId
    ]);
  }

  priorityClass(priorityName: string | null): string {
    const value = (priorityName || '')
      .trim()
      .toLowerCase();

    if (value === 'critical' || value === 'high') {
      return value === 'critical'
        ? 'priority-critical'
        : 'priority-high';
    }

    if (value === 'medium') {
      return 'priority-medium';
    }

    if (value === 'low') {
      return 'priority-low';
    }

    return '';
  }

  statusClass(statusName: string | null): string {
    const value = (statusName || '')
      .trim()
      .toLowerCase();

    if (value === 'open') {
      return 'status-open';
    }

    if (value === 'in progress') {
      return 'status-progress';
    }

    if (value === 'resolved') {
      return 'status-resolved';
    }

    if (value === 'closed') {
      return 'status-closed';
    }

    if (value === 'reopened') {
      return 'status-reopened';
    }

    return '';
  }
}
