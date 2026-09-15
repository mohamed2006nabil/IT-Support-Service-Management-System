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
  FormsModule
} from '@angular/forms';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  Router
} from '@angular/router';

import { UsersService } from '../../services/users';


// =========================================================
// Interfaces
// =========================================================

export interface AdminTicket {

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


export interface AdminUser {

  id: number;

  fullName: string;

  email: string;

  phone?: string | null;

  departmentId?: number | null;

  departmentName?: string | null;

  roleId: number;

  roleName: string;

  isActive: boolean;

  createdAt: string;
}


export interface LookupItem {

  id: number;

  name: string;
}


// =========================================================
// Component
// =========================================================

@Component({
  selector: 'app-admin-tickets',

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './admin-tickets.html',

  styleUrl: './admin-tickets.css'
})
export class AdminTickets implements OnInit {


  // =======================================================
  // Platform
  // =======================================================

  private platformId =
    inject(PLATFORM_ID);

  readonly usersService =
    inject(UsersService);


  // =======================================================
  // API URLs
  // =======================================================

  private ticketsApi =
    'http://localhost:5058/api/tickets';

  private usersApi =
    'http://localhost:5058/api/users';

  private categoriesApi =
    'http://localhost:5058/api/categories';

  private prioritiesApi =
    'http://localhost:5058/api/priorities';

  private statusesApi =
    'http://localhost:5058/api/statuses';


  // =======================================================
  // Main Data
  // =======================================================

  tickets =
    signal<AdminTicket[]>([]);

  users =
    signal<AdminUser[]>([]);

  categories =
    signal<LookupItem[]>([]);

  priorities =
    signal<LookupItem[]>([]);

  statuses =
    signal<LookupItem[]>([]);


  // =======================================================
  // UI State
  // =======================================================

  loading =
    signal(false);

  saving =
    signal(false);

  deleting =
    signal(false);


  // =======================================================
  // Search & Filters
  // =======================================================

  searchTerm =
    signal('');

  selectedStatusId =
    signal(0);

  selectedPriorityId =
    signal(0);

  selectedCategoryId =
    signal(0);

  selectedAgentId =
    signal(0);


  // =======================================================
  // Current Admin
  // =======================================================

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

  // =======================================================
  // Ticket Metrics
  // =======================================================

  totalTickets = computed(() => this.tickets().length);

  openTickets = computed(() => this.countByStatus('open'));

  inProgressTickets = computed(() =>
    this.countByStatus('in progress')
  );

  resolvedTickets = computed(() =>
    this.countByStatus('resolved')
  );

  closedTickets = computed(() =>
    this.countByStatus('closed')
  );

  reopenedTickets = computed(() =>
    this.countByStatus('reopened')
  );

  // =======================================================
  // Pagination
  // =======================================================

  pageSize = 8;

  currentPage = signal(1);

  totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(
        this.filteredTickets().length /
        this.pageSize
      )
    )
  );

  pageNumbers = computed(() =>
    Array.from(
      { length: this.totalPages() },
      (_, index) => index + 1
    )
  );

  pagedTickets = computed(() => {
    const page = Math.min(
      this.currentPage(),
      this.totalPages()
    );

    const start =
      (page - 1) * this.pageSize;

    return this.filteredTickets().slice(
      start,
      start + this.pageSize
    );
  });

  // =======================================================
  // Selected Ticket
  // =======================================================

  selectedTicket =
    signal<AdminTicket | null>(null);


  // =======================================================
  // Modal States
  // =======================================================

  showDetailsModal =
    signal(false);

  showEditModal =
    signal(false);

  showDeleteModal =
    signal(false);


  // =======================================================
  // Messages
  // =======================================================

  message =
    signal('');

  messageType =
    signal<'success' | 'error'>('success');


  // =======================================================
  // Delete Target
  // =======================================================

  ticketToDelete =
    signal<AdminTicket | null>(null);


  // =======================================================
  // Edit Form
  // =======================================================

  editTicket = {

    id: 0,

    title: '',

    description: '',

    userId: 0,

    assignedToId: null as number | null,

    categoryId: 0,

    priorityId: 0,

    statusId: 0

  };


  // =======================================================
  // Filtered Tickets
  // =======================================================

  filteredTickets =
    computed(() => {

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const statusId =
        this.selectedStatusId();

      const priorityId =
        this.selectedPriorityId();

      const categoryId =
        this.selectedCategoryId();

      const agentId =
        this.selectedAgentId();


      return this.tickets().filter(ticket => {

        // Search
        const matchesSearch =
          !search ||

          ticket.title
            .toLowerCase()
            .includes(search) ||

          ticket.description
            .toLowerCase()
            .includes(search) ||

          ticket.userName
            .toLowerCase()
            .includes(search) ||

          (
            ticket.assignedToName &&
            ticket.assignedToName
              .toLowerCase()
              .includes(search)
          );


        // Status
        const matchesStatus =
          statusId === 0 ||
          ticket.statusId === statusId;


        // Priority
        const matchesPriority =
          priorityId === 0 ||
          ticket.priorityId === priorityId;


        // Category
        const matchesCategory =
          categoryId === 0 ||
          ticket.categoryId === categoryId;


        // Agent
        const matchesAgent =
          agentId === 0 ||
          ticket.assignedToId === agentId;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesCategory &&
          matchesAgent
        );

      });

    });


  // =======================================================
  // Constructor
  // =======================================================

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}


  // =======================================================
  // On Init
  // =======================================================

  ngOnInit(): void {

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      this.loadAdminUser();
      this.loadAllData();

    }

  }

  // =======================================================
  // Current Admin
  // =======================================================

  private loadAdminUser(): void {

    const userData =
      localStorage.getItem('user');

    if (!userData) {
      return;
    }

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


  // =======================================================
  // Authorization Headers
  // =======================================================

  private getHeaders(): HttpHeaders {

    const token =
      localStorage.getItem('token');

    return new HttpHeaders({

      Authorization:
        `Bearer ${token}`

    });

  }


  // =======================================================
  // Load All Data
  // =======================================================

  loadAllData(): void {

    this.loadTickets();

    this.loadUsers();

    this.loadCategories();

    this.loadPriorities();

    this.loadStatuses();

  }


  // =======================================================
  // Load Tickets
  // =======================================================

  loadTickets(): void {

    this.loading.set(true);

    this.http
      .get<AdminTicket[]>(
        this.ticketsApi,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (data) => {

          this.tickets.set(data);
          this.currentPage.set(
            Math.min(
              this.currentPage(),
              Math.max(
                1,
                Math.ceil(
                  data.length /
                  this.pageSize
                )
              )
            )
          );
          this.lastUpdated.set(
            new Date().toISOString()
          );

          this.loading.set(false);

        },

        error: (error) => {

          console.error(
            'Failed to load tickets:',
            error
          );

          this.loading.set(false);

          this.showMessage(
            'Failed to load tickets.',
            'error'
          );

        }

      });

  }


  // =======================================================
  // Load Users
  // =======================================================

  loadUsers(): void {

    this.http
      .get<AdminUser[]>(
        this.usersApi,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (data) => {

          this.users.set(data);

        },

        error: (error) => {

          console.error(
            'Failed to load users:',
            error
          );

        }

      });

  }


  // =======================================================
  // Load Categories
  // =======================================================

  loadCategories(): void {

    this.http
      .get<LookupItem[]>(
        this.categoriesApi,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (data) => {

          this.categories.set(data);

        },

        error: (error) => {

          console.error(
            'Failed to load categories:',
            error
          );

        }

      });

  }


  // =======================================================
  // Load Priorities
  // =======================================================

  loadPriorities(): void {

    this.http
      .get<LookupItem[]>(
        this.prioritiesApi,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (data) => {

          this.priorities.set(data);

        },

        error: (error) => {

          console.error(
            'Failed to load priorities:',
            error
          );

        }

      });

  }


  // =======================================================
  // Load Statuses
  // =======================================================

  loadStatuses(): void {

    this.http
      .get<LookupItem[]>(
        this.statusesApi,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (data) => {

          this.statuses.set(data);

        },

        error: (error) => {

          console.error(
            'Failed to load statuses:',
            error
          );

        }

      });

  }


  // =======================================================
  // Ticket Metric Helpers
  // =======================================================

  countByStatus(statusName: string): number {
    return this.tickets().filter(
      ticket =>
        ticket.statusName?.trim().toLowerCase() === statusName
    ).length;
  }

  // =======================================================
  // Get IT Agents
  // =======================================================

  get agents(): AdminUser[] {

    return this.users().filter(
      user =>
        user.roleName
          ?.trim()
          .toLowerCase() === 'it agent' &&
        user.isActive
    );

  }


  // =======================================================
  // View Ticket Details
  // =======================================================

  viewTicket(ticket: AdminTicket): void {

    this.selectedTicket.set(ticket);

    this.showDetailsModal.set(true);

  }


  // =======================================================
  // Close Details
  // =======================================================

  closeDetails(): void {

    this.showDetailsModal.set(false);

    this.selectedTicket.set(null);

  }


  // =======================================================
  // Open Edit Modal
  // =======================================================

  openEditTicket(ticket: AdminTicket): void {

    this.editTicket = {

      id: ticket.id,

      title: ticket.title,

      description: ticket.description,

      userId: ticket.userId,

      assignedToId:
        ticket.assignedToId,

      categoryId:
        ticket.categoryId,

      priorityId:
        ticket.priorityId,

      statusId:
        ticket.statusId

    };


    this.showDetailsModal.set(false);

    this.showEditModal.set(true);

  }


  // =======================================================
  // Close Edit Modal
  // =======================================================

  closeEditModal(): void {

    if (this.saving()) {
      return;
    }

    this.showEditModal.set(false);

  }


  // =======================================================
  // Save Ticket
  // =======================================================

  saveTicket(): void {

    if (
      !this.editTicket.title.trim()
    ) {

      this.showMessage(
        'Ticket title is required.',
        'error'
      );

      return;

    }


    if (
      !this.editTicket.description.trim()
    ) {

      this.showMessage(
        'Ticket description is required.',
        'error'
      );

      return;

    }


    if (
      !this.editTicket.userId
    ) {

      this.showMessage(
        'Employee is required.',
        'error'
      );

      return;

    }


    if (
      !this.editTicket.categoryId
    ) {

      this.showMessage(
        'Category is required.',
        'error'
      );

      return;

    }


    if (
      !this.editTicket.priorityId
    ) {

      this.showMessage(
        'Priority is required.',
        'error'
      );

      return;

    }


    if (
      !this.editTicket.statusId
    ) {

      this.showMessage(
        'Status is required.',
        'error'
      );

      return;

    }


    const body = {

      title:
        this.editTicket.title.trim(),

      description:
        this.editTicket.description.trim(),

      userId:
        Number(this.editTicket.userId),

      assignedToId:
        this.editTicket.assignedToId
          ? Number(this.editTicket.assignedToId)
          : null,

      categoryId:
        Number(this.editTicket.categoryId),

      priorityId:
        Number(this.editTicket.priorityId),

      statusId:
        Number(this.editTicket.statusId),

      resolvedAt:
        null,

      closedAt:
        null

    };


    this.saving.set(true);


    this.http
      .put(
        `${this.ticketsApi}/${this.editTicket.id}`,
        body,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: () => {

          this.saving.set(false);

          this.showEditModal.set(false);

          this.showMessage(
            'Ticket updated successfully.',
            'success'
          );

          this.loadTickets();

        },

        error: (error) => {

          this.saving.set(false);

          console.error(
            'Failed to update ticket:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to update ticket.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  // =======================================================
  // Change Assignment
  // =======================================================

  changeAssignment(
    assignedToId: number | null
  ): void {

    if (
      !this.selectedTicket()
    ) {
      return;
    }


    const ticket =
      this.selectedTicket()!;


    this.editTicket = {

      id: ticket.id,

      title: ticket.title,

      description: ticket.description,

      userId: ticket.userId,

      assignedToId:
        assignedToId,

      categoryId:
        ticket.categoryId,

      priorityId:
        ticket.priorityId,

      statusId:
        ticket.statusId

    };


    this.saveTicket();

  }


  // =======================================================
  // Change Status
  // =======================================================

  changeStatus(
    statusId: number
  ): void {

    if (
      !this.selectedTicket()
    ) {
      return;
    }


    const ticket =
      this.selectedTicket()!;


    this.editTicket = {

      id: ticket.id,

      title: ticket.title,

      description: ticket.description,

      userId: ticket.userId,

      assignedToId:
        ticket.assignedToId,

      categoryId:
        ticket.categoryId,

      priorityId:
        ticket.priorityId,

      statusId:
        Number(statusId)

    };


    this.saveTicket();

  }


  // =======================================================
  // Get Allowed Next Statuses
  // =======================================================

  getAllowedStatuses(
    currentStatusId: number
  ): LookupItem[] {

    const statusMap: {
      [key: number]: number[]
    } = {

      1: [1, 2],

      2: [2, 3],

      3: [3, 4, 5],

      4: [4, 5],

      5: [5, 2]

    };


    const allowedIds =
      statusMap[currentStatusId] || [];


    return this.statuses().filter(
      status =>
        allowedIds.includes(status.id)
    );

  }


  // =======================================================
  // Delete Confirmation
  // =======================================================

  openDeleteModal(
    ticket: AdminTicket
  ): void {

    this.ticketToDelete.set(ticket);

    this.showDeleteModal.set(true);

  }


  // =======================================================
  // Close Delete Modal
  // =======================================================

  closeDeleteModal(): void {

    if (this.deleting()) {
      return;
    }

    this.showDeleteModal.set(false);

    this.ticketToDelete.set(null);

  }


  // =======================================================
  // Delete Ticket
  // =======================================================

  confirmDelete(): void {

    const ticket =
      this.ticketToDelete();


    if (!ticket) {
      return;
    }


    this.deleting.set(true);


    this.http
      .delete(
        `${this.ticketsApi}/${ticket.id}`,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: () => {

          this.deleting.set(false);

          this.showDeleteModal.set(false);

          this.ticketToDelete.set(null);


          this.showMessage(
            `Ticket #${ticket.id} deleted successfully.`,
            'success'
          );


          this.loadTickets();

        },

        error: (error) => {

          this.deleting.set(false);

          console.error(
            'Failed to delete ticket:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to delete ticket.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  // =======================================================
  // Reset Filters
  // =======================================================

  clearFilters(): void {

    this.searchTerm.set('');

    this.selectedStatusId.set(0);

    this.selectedPriorityId.set(0);

    this.selectedCategoryId.set(0);

    this.selectedAgentId.set(0);

    this.currentPage.set(1);

  }


  // =======================================================
  // Refresh
  // =======================================================

  refreshTickets(): void {

    this.loadTickets();

  }


  // =======================================================
  // Pagination
  // =======================================================

  goToPage(page: number): void {

    const safePage =
      Math.max(
        1,
        Math.min(
          page,
          this.totalPages()
        )
      );

    this.currentPage.set(safePage);

  }

  previousPage(): void {
    this.goToPage(
      this.currentPage() - 1
    );
  }

  nextPage(): void {
    this.goToPage(
      this.currentPage() + 1
    );
  }

  pageEnd(): number {
    return Math.min(
      this.currentPage() * this.pageSize,
      this.filteredTickets().length
    );
  }

  // =======================================================
  // Navigation
  // =======================================================

  goHome(): void {

    this.router.navigate([
      '/admin/dashboard'
    ]);

  }

  goToUsers(): void {

    this.router.navigate([
      '/admin/users'
    ]);

  }

  logout(): void {

    localStorage.removeItem('token');

    this.router.navigate([
      '/login'
    ]);

  }

  // =======================================================
  // Message
  // =======================================================

  showMessage(
    text: string,
    type: 'success' | 'error'
  ): void {

    this.message.set(text);

    this.messageType.set(type);


    setTimeout(() => {

      this.message.set('');

    }, 4000);

  }


  // =======================================================
  // Get Badge Class
  // =======================================================

  getPriorityClass(
    priorityName: string
  ): string {

    switch (
      priorityName
        ?.trim()
        .toLowerCase()
    ) {

      case 'low':
        return 'priority-low';

      case 'medium':
        return 'priority-medium';

      case 'high':
        return 'priority-high';

      case 'critical':
        return 'priority-critical';

      default:
        return 'priority-default';

    }

  }


  // =======================================================
  // Get Status Class
  // =======================================================

  getStatusClass(
    statusName: string
  ): string {

    switch (
      statusName
        ?.trim()
        .toLowerCase()
    ) {

      case 'open':
        return 'status-open';

      case 'in progress':
        return 'status-progress';

      case 'resolved':
        return 'status-resolved';

      case 'closed':
        return 'status-closed';

      case 'reopened':
        return 'status-reopened';

      default:
        return 'status-default';

    }

  }


  // =======================================================
  // Format Date
  // =======================================================

  formatDate(
    date: string | null
  ): string {

    if (!date) {
      return '—';
    }


    const parsedDate =
      new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return '—';

    }


    return parsedDate.toLocaleString(
      'en-GB',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );

  }


  // =======================================================
  // Back
  // =======================================================

  goBack(): void {

    this.goHome();

  }

}