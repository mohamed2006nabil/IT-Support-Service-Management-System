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

export interface AdminPriority {
  id: number;
  name: string;
  description: string | null;
}

interface AdminUser {
  fullName: string;
  role: string;
  profileImagePath: string | null;
}

@Component({
  selector: 'app-admin-priorities',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-priorities.html',
  styleUrl: './admin-priorities.css'
})
export class AdminPriorities implements OnInit {

  private platformId = inject(PLATFORM_ID);
  private readonly usersService = inject(UsersService);

  private apiUrl =
    'http://localhost:5058/api/priorities';

  priorities = signal<AdminPriority[]>([]);

  loading = signal(false);
  saving = signal(false);
  deleting = signal(false);

  searchTerm = signal('');

  selectedPriority =
    signal<AdminPriority | null>(null);

  priorityToDelete =
    signal<AdminPriority | null>(null);

  showDetailsModal = signal(false);
  showAddModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);

  message = signal('');

  messageType =
    signal<'success' | 'error'>('success');

  // Navbar
  adminUser = signal<AdminUser>({
    fullName: 'Administrator',
    role: 'Admin',
    profileImagePath: null
  });

  isProfileMenuOpen = false;
  profileImageLoadFailed = false;

  // Last updated
  lastUpdated = signal(new Date());

  // Local pagination
  readonly pageSize = 8;
  currentPage = signal(1);

  newPriority = {
    name: '',
    description: ''
  };

  editPriority = {
    id: 0,
    name: '',
    description: ''
  };

  filteredPriorities = computed(() => {

    const search =
      this.searchTerm()
        .trim()
        .toLowerCase();

    if (!search) {
      return this.priorities();
    }

    return this.priorities().filter(priority =>
      priority.name
        .toLowerCase()
        .includes(search) ||

      (
        priority.description &&
        priority.description
          .toLowerCase()
          .includes(search)
      )
    );

  });

  totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(
        this.filteredPriorities().length /
        this.pageSize
      )
    )
  );

  pagedPriorities = computed(() => {

    const page = Math.min(
      this.currentPage(),
      this.totalPages()
    );

    const start =
      (page - 1) * this.pageSize;

    return this.filteredPriorities().slice(
      start,
      start + this.pageSize
    );

  });

  pageNumbers = computed(() =>
    Array.from(
      { length: this.totalPages() },
      (_, index) => index + 1
    )
  );

  pageStart = computed(() => {

    const total =
      this.filteredPriorities().length;

    if (!total) {
      return 0;
    }

    return (
      (this.currentPage() - 1) *
      this.pageSize
    ) + 1;

  });

  pageEnd = computed(() =>
    Math.min(
      this.currentPage() * this.pageSize,
      this.filteredPriorities().length
    )
  );


  constructor(
    private http: HttpClient,
    private router: Router
  ) {}


  ngOnInit(): void {

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {
      this.loadAdminUser();
      this.loadPriorities();
    }

  }


  private loadAdminUser(): void {

    const userData =
      localStorage.getItem('user');

    if (!userData) {
      return;
    }

    try {

      const user =
        JSON.parse(userData);

      this.adminUser.set({
        fullName:
          user.fullName ||
          'Administrator',

        role:
          user.role ||
          user.roleName ||
          'Admin',

        profileImagePath:
          user.profileImagePath ||
          null
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

    this.isProfileMenuOpen =
      !this.isProfileMenuOpen;

  }


  getProfileImageUrl(): string | null {

    if (
      !this.adminUser().profileImagePath ||
      this.profileImageLoadFailed
    ) {
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

    this.router.navigate([
      '/admin/profile'
    ]);

  }


  logout(): void {

    this.isProfileMenuOpen = false;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.router.navigate(['/']);

  }


  formatLastUpdated(
    date: Date
  ): string {

    return date.toLocaleString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    );

  }


  private getHeaders(): HttpHeaders {

    const token =
      localStorage.getItem('token');

    return new HttpHeaders({
      Authorization:
        `Bearer ${token}`
    });

  }


  loadPriorities(): void {

    this.loading.set(true);

    this.http
      .get<AdminPriority[]>(
        this.apiUrl,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (data) => {

          this.priorities.set(data);

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
            new Date()
          );

          this.loading.set(false);

        },

        error: (error) => {

          console.error(
            'Failed to load priorities:',
            error
          );

          this.loading.set(false);

          this.showMessage(
            'Failed to load priorities.',
            'error'
          );

        }

      });

  }


  refreshPriorities(): void {

    this.loadPriorities();

  }


  openAddModal(): void {

    this.newPriority = {
      name: '',
      description: ''
    };

    this.showAddModal.set(true);

  }


  closeAddModal(): void {

    if (this.saving()) {
      return;
    }

    this.showAddModal.set(false);

  }


  createPriority(): void {

    const name =
      this.newPriority.name.trim();

    const description =
      this.newPriority.description.trim();


    if (!name) {

      this.showMessage(
        'Priority name is required.',
        'error'
      );

      return;

    }


    if (name.length < 2) {

      this.showMessage(
        'Priority name must be at least 2 characters.',
        'error'
      );

      return;

    }


    this.saving.set(true);


    const body = {
      name: name,
      description:
        description || null
    };


    this.http
      .post<AdminPriority>(
        this.apiUrl,
        body,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (createdPriority) => {

          this.saving.set(false);

          this.showAddModal.set(false);


          this.priorities.update(
            priorities => [
              ...priorities,
              createdPriority
            ]
          );

          this.currentPage.set(
            this.totalPages()
          );


          this.showMessage(
            'Priority created successfully.',
            'success'
          );

        },

        error: (error) => {

          this.saving.set(false);

          console.error(
            'Failed to create priority:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to create priority.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  viewPriority(
    priority: AdminPriority
  ): void {

    this.selectedPriority.set(priority);

    this.showDetailsModal.set(true);

  }


  closeDetails(): void {

    this.showDetailsModal.set(false);

    this.selectedPriority.set(null);

  }


  openEditModal(
    priority: AdminPriority
  ): void {

    this.editPriority = {
      id: priority.id,
      name: priority.name,
      description:
        priority.description || ''
    };


    this.showDetailsModal.set(false);

    this.showEditModal.set(true);

  }


  closeEditModal(): void {

    if (this.saving()) {
      return;
    }

    this.showEditModal.set(false);

  }


  updatePriority(): void {

    const name =
      this.editPriority.name.trim();

    const description =
      this.editPriority.description.trim();


    if (!name) {

      this.showMessage(
        'Priority name is required.',
        'error'
      );

      return;

    }


    if (name.length < 2) {

      this.showMessage(
        'Priority name must be at least 2 characters.',
        'error'
      );

      return;

    }


    this.saving.set(true);


    const body = {
      name: name,
      description:
        description || null
    };


    this.http
      .put(
        `${this.apiUrl}/${this.editPriority.id}`,
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


          this.priorities.update(
            priorities =>
              priorities.map(priority =>
                priority.id ===
                this.editPriority.id
                  ? {
                      ...priority,
                      name: name,
                      description:
                        description || null
                    }
                  : priority
              )
          );


          this.showMessage(
            'Priority updated successfully.',
            'success'
          );

        },

        error: (error) => {

          this.saving.set(false);

          console.error(
            'Failed to update priority:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to update priority.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  openDeleteModal(
    priority: AdminPriority
  ): void {

    this.priorityToDelete.set(priority);

    this.showDeleteModal.set(true);

  }


  closeDeleteModal(): void {

    if (this.deleting()) {
      return;
    }

    this.showDeleteModal.set(false);

    this.priorityToDelete.set(null);

  }


  confirmDelete(): void {

    const priority =
      this.priorityToDelete();


    if (!priority) {
      return;
    }


    this.deleting.set(true);


    this.http
      .delete(
        `${this.apiUrl}/${priority.id}`,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: () => {

          this.deleting.set(false);

          this.showDeleteModal.set(false);

          this.priorityToDelete.set(null);


          this.priorities.update(
            priorities =>
              priorities.filter(
                item =>
                  item.id !== priority.id
              )
          );

          this.currentPage.set(
            Math.min(
              this.currentPage(),
              this.totalPages()
            )
          );


          this.showMessage(
            `Priority #${priority.id} deleted successfully.`,
            'success'
          );

        },

        error: (error) => {

          this.deleting.set(false);

          console.error(
            'Failed to delete priority:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to delete priority.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  clearSearch(): void {

    this.searchTerm.set('');
    this.currentPage.set(1);

  }


  onSearchChange(
    value: string
  ): void {

    this.searchTerm.set(value);
    this.currentPage.set(1);

  }


  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages()
    ) {
      return;
    }

    this.currentPage.set(page);

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


  priorityCount(
    priorityName: string
  ): number {

    return this.priorities()
      .filter(priority =>
        priority.name
          .trim()
          .toLowerCase() ===
        priorityName
          .trim()
          .toLowerCase()
      )
      .length;

  }


  standardPriorityCount(): number {

    return this.priorities()
      .filter(priority => {

        const name =
          priority.name
            .trim()
            .toLowerCase();

        return (
          name !== 'critical' &&
          name !== 'high'
        );

      })
      .length;

  }


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


  goBack(): void {

    this.router.navigate([
      '/admin-dashboard'
    ]);

  }

}
