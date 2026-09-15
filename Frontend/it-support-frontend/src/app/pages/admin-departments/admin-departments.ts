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

export interface AdminDepartment {
  id: number;
  name: string;
}

interface AdminUser {
  fullName: string;
  role: string;
  profileImagePath: string | null;
}

@Component({
  selector: 'app-admin-departments',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-departments.html',
  styleUrl: './admin-departments.css'
})
export class AdminDepartments implements OnInit {

  private platformId = inject(PLATFORM_ID);
  private readonly usersService = inject(UsersService);

  private apiUrl =
    'http://localhost:5058/api/departments';

  departments = signal<AdminDepartment[]>([]);

  loading = signal(false);
  saving = signal(false);
  deleting = signal(false);

  searchTerm = signal('');

  selectedDepartment =
    signal<AdminDepartment | null>(null);

  departmentToDelete =
    signal<AdminDepartment | null>(null);

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

  newDepartment = {
    name: ''
  };

  editDepartment = {
    id: 0,
    name: ''
  };

  filteredDepartments = computed(() => {

    const search =
      this.searchTerm()
        .trim()
        .toLowerCase();

    if (!search) {
      return this.departments();
    }

    return this.departments().filter(
      department =>
        department.name
          .toLowerCase()
          .includes(search)
    );

  });

  totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(
        this.filteredDepartments().length /
        this.pageSize
      )
    )
  );

  pagedDepartments = computed(() => {

    const page = Math.min(
      this.currentPage(),
      this.totalPages()
    );

    const start =
      (page - 1) * this.pageSize;

    return this.filteredDepartments().slice(
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
      this.filteredDepartments().length;

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
      this.filteredDepartments().length
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
      this.loadDepartments();
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


  loadDepartments(): void {

    this.loading.set(true);

    this.http
      .get<AdminDepartment[]>(
        this.apiUrl,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (data) => {

          this.departments.set(data);

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
            'Failed to load departments:',
            error
          );

          this.loading.set(false);

          this.showMessage(
            'Failed to load departments.',
            'error'
          );

        }

      });

  }


  refreshDepartments(): void {

    this.loadDepartments();

  }


  openAddModal(): void {

    this.newDepartment = {
      name: ''
    };

    this.showAddModal.set(true);

  }


  closeAddModal(): void {

    if (this.saving()) {
      return;
    }

    this.showAddModal.set(false);

  }


  createDepartment(): void {

    const name =
      this.newDepartment.name.trim();


    if (!name) {

      this.showMessage(
        'Department name is required.',
        'error'
      );

      return;

    }


    if (name.length < 2) {

      this.showMessage(
        'Department name must be at least 2 characters.',
        'error'
      );

      return;

    }


    this.saving.set(true);


    const body = {
      name: name
    };


    this.http
      .post<AdminDepartment>(
        this.apiUrl,
        body,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (createdDepartment) => {

          this.saving.set(false);

          this.showAddModal.set(false);


          this.departments.update(
            departments => [
              ...departments,
              createdDepartment
            ]
          );

          this.currentPage.set(
            this.totalPages()
          );


          this.showMessage(
            'Department created successfully.',
            'success'
          );

        },

        error: (error) => {

          this.saving.set(false);

          console.error(
            'Failed to create department:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to create department.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  viewDepartment(
    department: AdminDepartment
  ): void {

    this.selectedDepartment.set(
      department
    );

    this.showDetailsModal.set(true);

  }


  closeDetails(): void {

    this.showDetailsModal.set(false);

    this.selectedDepartment.set(null);

  }


  openEditModal(
    department: AdminDepartment
  ): void {

    this.editDepartment = {
      id: department.id,
      name: department.name
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


  updateDepartment(): void {

    const name =
      this.editDepartment.name.trim();


    if (!name) {

      this.showMessage(
        'Department name is required.',
        'error'
      );

      return;

    }


    if (name.length < 2) {

      this.showMessage(
        'Department name must be at least 2 characters.',
        'error'
      );

      return;

    }


    this.saving.set(true);


    const body = {
      name: name
    };


    this.http
      .put(
        `${this.apiUrl}/${this.editDepartment.id}`,
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


          this.departments.update(
            departments =>
              departments.map(department =>
                department.id ===
                this.editDepartment.id
                  ? {
                      ...department,
                      name: name
                    }
                  : department
              )
          );


          this.showMessage(
            'Department updated successfully.',
            'success'
          );

        },

        error: (error) => {

          this.saving.set(false);

          console.error(
            'Failed to update department:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to update department.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  openDeleteModal(
    department: AdminDepartment
  ): void {

    this.departmentToDelete.set(
      department
    );

    this.showDeleteModal.set(true);

  }


  closeDeleteModal(): void {

    if (this.deleting()) {
      return;
    }

    this.showDeleteModal.set(false);

    this.departmentToDelete.set(null);

  }


  confirmDelete(): void {

    const department =
      this.departmentToDelete();


    if (!department) {
      return;
    }


    this.deleting.set(true);


    this.http
      .delete(
        `${this.apiUrl}/${department.id}`,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: () => {

          this.deleting.set(false);

          this.showDeleteModal.set(false);

          this.departmentToDelete.set(null);


          this.departments.update(
            departments =>
              departments.filter(
                item =>
                  item.id !== department.id
              )
          );

          this.currentPage.set(
            Math.min(
              this.currentPage(),
              this.totalPages()
            )
          );


          this.showMessage(
            `Department #${department.id} deleted successfully.`,
            'success'
          );

        },

        error: (error) => {

          this.deleting.set(false);

          console.error(
            'Failed to delete department:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to delete department.';


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


  departmentCoveragePercent(): number {

    const total =
      this.departments().length;

    if (!total) {
      return 0;
    }

    return Math.round(
      (
        this.filteredDepartments().length /
        total
      ) * 100
    );

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
