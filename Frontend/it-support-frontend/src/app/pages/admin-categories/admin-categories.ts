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

import {
  UsersService
} from '../../services/users';


// =====================================================
// Interface
// =====================================================

export interface AdminCategory {

  id: number;

  name: string;

  description: string | null;

}


export interface AdminHeaderUser {

  fullName: string;

  role: string;

  profileImagePath: string | null;

}


// =====================================================
// Component
// =====================================================

@Component({
  selector: 'app-admin-categories',

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './admin-categories.html',

  styleUrl: './admin-categories.css'
})
export class AdminCategories implements OnInit {


  // ===================================================
  // Platform
  // ===================================================

  private platformId =
    inject(PLATFORM_ID);


  // ===================================================
  // API
  // ===================================================

  private apiUrl =
    'http://localhost:5058/api/categories';


  // ===================================================
  // Categories
  // ===================================================

  categories =
    signal<AdminCategory[]>([]);


  // ===================================================
  // Loading
  // ===================================================

  loading =
    signal(false);

  saving =
    signal(false);

  deleting =
    signal(false);


  // ===================================================
  // Admin Header
  // ===================================================

  adminUser =
    signal<AdminHeaderUser>({
      fullName: 'Administrator',
      role: 'Admin',
      profileImagePath: null
    });

  lastUpdated =
    signal<string | null>(null);

  isProfileMenuOpen = false;

  profileImageLoadFailed = false;


  // ===================================================
  // Search
  // ===================================================

  searchTerm =
    signal('');


  // ===================================================
  // Selected Category
  // ===================================================

  selectedCategory =
    signal<AdminCategory | null>(null);


  // ===================================================
  // Delete Target
  // ===================================================

  categoryToDelete =
    signal<AdminCategory | null>(null);


  // ===================================================
  // Modal States
  // ===================================================

  showDetailsModal =
    signal(false);

  showAddModal =
    signal(false);

  showEditModal =
    signal(false);

  showDeleteModal =
    signal(false);


  // ===================================================
  // Message
  // ===================================================

  message =
    signal('');

  messageType =
    signal<'success' | 'error'>('success');


  // ===================================================
  // New Category
  // ===================================================

  newCategory = {

    name: '',

    description: ''

  };


  // ===================================================
  // Edit Category
  // ===================================================

  editCategory = {

    id: 0,

    name: '',

    description: ''

  };


  // ===================================================
  // Filtered Categories
  // ===================================================

  filteredCategories =
    computed(() => {

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();


      if (!search) {

        return this.categories();

      }


      return this.categories()
        .filter(category =>

          category.name
            .toLowerCase()
            .includes(search) ||

          (
            category.description &&
            category.description
              .toLowerCase()
              .includes(search)
          )

        );

    });



  // ===================================================
  // Statistics
  // ===================================================

  categoriesWithDescription =
    computed(() =>
      this.categories().filter(
        category =>
          !!category.description?.trim()
      ).length
    );

  categoriesWithoutDescription =
    computed(() =>
      this.categories().length -
      this.categoriesWithDescription()
    );


  // ===================================================
  // Pagination
  // ===================================================

  readonly pageSize = 6;

  currentPage =
    signal(1);

  totalPages =
    computed(() =>
      Math.max(
        1,
        Math.ceil(
          this.filteredCategories().length /
          this.pageSize
        )
      )
    );

  pagedCategories =
    computed(() => {

      const start =
        (this.currentPage() - 1) *
        this.pageSize;

      return this.filteredCategories()
        .slice(
          start,
          start + this.pageSize
        );

    });

  pageNumbers =
    computed(() =>
      Array.from(
        { length: this.totalPages() },
        (_, index) => index + 1
      )
    );

  pageStart =
    computed(() =>
      this.filteredCategories().length === 0
        ? 0
        : (this.currentPage() - 1) *
            this.pageSize
    );

  pageEnd =
    computed(() =>
      Math.min(
        this.pageStart() + this.pageSize,
        this.filteredCategories().length
      )
    );

  // ===================================================
  // Constructor
  // ===================================================

  constructor(
    private http: HttpClient,
    private router: Router,
    readonly usersService: UsersService
  ) {}


  // ===================================================
  // On Init
  // ===================================================

  ngOnInit(): void {

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      this.loadAdminUser();
      this.loadCategories();

    }

  }


  // ===================================================
  // Current Admin
  // ===================================================

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
    this.router.navigate(['/admin/profile']);
  }

  logout(): void {
    this.isProfileMenuOpen = false;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/']);
  }

  formatLastUpdated(date: string | null): string {

    if (!date) {
      return 'Not yet';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Not yet';
    }

    return parsedDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

  }


  // ===================================================
  // Headers
  // ===================================================

  private getHeaders(): HttpHeaders {

    const token =
      localStorage.getItem('token');

    return new HttpHeaders({

      Authorization:
        `Bearer ${token}`

    });

  }


  // ===================================================
  // Load Categories
  // ===================================================

  loadCategories(): void {

    this.loading.set(true);


    this.http
      .get<AdminCategory[]>(
        this.apiUrl,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (data) => {

          this.categories.set(data);
          this.lastUpdated.set(new Date().toISOString());

          this.loading.set(false);

        },

        error: (error) => {

          console.error(
            'Failed to load categories:',
            error
          );

          this.loading.set(false);

          this.showMessage(
            'Failed to load categories.',
            'error'
          );

        }

      });

  }


  // ===================================================
  // Refresh
  // ===================================================

  refreshCategories(): void {

    this.loadCategories();

  }


  // ===================================================
  // Open Add Modal
  // ===================================================

  openAddModal(): void {

    this.newCategory = {

      name: '',

      description: ''

    };


    this.showAddModal.set(true);

  }


  // ===================================================
  // Close Add Modal
  // ===================================================

  closeAddModal(): void {

    if (this.saving()) {
      return;
    }

    this.showAddModal.set(false);

  }


  // ===================================================
  // Create Category
  // ===================================================

  createCategory(): void {

    const name =
      this.newCategory.name.trim();

    const description =
      this.newCategory.description.trim();


    if (!name) {

      this.showMessage(
        'Category name is required.',
        'error'
      );

      return;

    }


    if (name.length < 2) {

      this.showMessage(
        'Category name must be at least 2 characters.',
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
      .post<AdminCategory>(
        this.apiUrl,
        body,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: (createdCategory) => {

          this.saving.set(false);

          this.showAddModal.set(false);


          this.categories.update(
            categories => [
              ...categories,
              createdCategory
            ]
          );

          this.currentPage.set(
            this.totalPages()
          );


          this.showMessage(
            'Category created successfully.',
            'success'
          );

        },

        error: (error) => {

          this.saving.set(false);

          console.error(
            'Failed to create category:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to create category.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  // ===================================================
  // View Category
  // ===================================================

  viewCategory(
    category: AdminCategory
  ): void {

    this.selectedCategory.set(category);

    this.showDetailsModal.set(true);

  }


  // ===================================================
  // Close Details
  // ===================================================

  closeDetails(): void {

    this.showDetailsModal.set(false);

    this.selectedCategory.set(null);

  }


  // ===================================================
  // Open Edit Modal
  // ===================================================

  openEditModal(
    category: AdminCategory
  ): void {

    this.editCategory = {

      id: category.id,

      name: category.name,

      description:
        category.description || ''

    };


    this.showDetailsModal.set(false);

    this.showEditModal.set(true);

  }


  // ===================================================
  // Close Edit Modal
  // ===================================================

  closeEditModal(): void {

    if (this.saving()) {
      return;
    }

    this.showEditModal.set(false);

  }


  // ===================================================
  // Update Category
  // ===================================================

  updateCategory(): void {

    const name =
      this.editCategory.name.trim();

    const description =
      this.editCategory.description.trim();


    if (!name) {

      this.showMessage(
        'Category name is required.',
        'error'
      );

      return;

    }


    if (name.length < 2) {

      this.showMessage(
        'Category name must be at least 2 characters.',
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
        `${this.apiUrl}/${this.editCategory.id}`,
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


          this.categories.update(
            categories =>
              categories.map(category =>

                category.id ===
                this.editCategory.id

                  ? {
                      ...category,

                      name: name,

                      description:
                        description || null
                    }

                  : category

              )
          );


          this.showMessage(
            'Category updated successfully.',
            'success'
          );

        },

        error: (error) => {

          this.saving.set(false);

          console.error(
            'Failed to update category:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to update category.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  // ===================================================
  // Open Delete Modal
  // ===================================================

  openDeleteModal(
    category: AdminCategory
  ): void {

    this.categoryToDelete.set(category);

    this.showDeleteModal.set(true);

  }


  // ===================================================
  // Close Delete Modal
  // ===================================================

  closeDeleteModal(): void {

    if (this.deleting()) {
      return;
    }

    this.showDeleteModal.set(false);

    this.categoryToDelete.set(null);

  }


  // ===================================================
  // Delete Category
  // ===================================================

  confirmDelete(): void {

    const category =
      this.categoryToDelete();


    if (!category) {
      return;
    }


    this.deleting.set(true);


    this.http
      .delete(
        `${this.apiUrl}/${category.id}`,
        {
          headers:
            this.getHeaders()
        }
      )
      .subscribe({

        next: () => {

          this.deleting.set(false);

          this.showDeleteModal.set(false);

          this.categoryToDelete.set(null);


          this.categories.update(
            categories =>
              categories.filter(
                item =>
                  item.id !== category.id
              )
          );

          const nextTotalPages =
            Math.max(
              1,
              Math.ceil(
                this.filteredCategories().length /
                this.pageSize
              )
            );

          if (
            this.currentPage() >
            nextTotalPages
          ) {
            this.currentPage.set(
              nextTotalPages
            );
          }


          this.showMessage(
            `Category #${category.id} deleted successfully.`,
            'success'
          );

        },

        error: (error) => {

          this.deleting.set(false);

          console.error(
            'Failed to delete category:',
            error
          );


          const errorMessage =
            error?.error?.message ||
            'Failed to delete category.';


          this.showMessage(
            errorMessage,
            'error'
          );

        }

      });

  }


  // ===================================================
  // Clear Search
  // ===================================================

  clearSearch(): void {

    this.searchTerm.set('');

    this.currentPage.set(1);

  }



  // ===================================================
  // Pagination
  // ===================================================

  onSearchChange(value: string): void {

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

  // ===================================================
  // Show Message
  // ===================================================

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


  // ===================================================
  // Back
  // ===================================================

  goBack(): void {

    this.router.navigate([
      '/admin/dashboard'
    ]);

  }

}