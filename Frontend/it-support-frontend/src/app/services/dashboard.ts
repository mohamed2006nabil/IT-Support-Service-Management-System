import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardUserSummary {
  total: number;
  employees: number;
  itAgents: number;
  admins: number;
  active: number;
}

export interface DashboardTicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  reopened: number;
}

export interface RecentTicket {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdBy: string;
  createdAt: string;
}

export interface DashboardBreakdown {
  name: string;
  count: number;
}

export interface RecentActivity {
  ticketId: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string;
  createdAt: string;
}

export interface DashboardSummary {
  users: DashboardUserSummary;
  tickets: DashboardTicketSummary;
  recentTickets: RecentTicket[];
  ticketsByPriority: DashboardBreakdown[];
  ticketsByCategory: DashboardBreakdown[];
  recentActivity: RecentActivity[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5058/api/dashboard';

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(
      this.apiUrl
    );
  }
}