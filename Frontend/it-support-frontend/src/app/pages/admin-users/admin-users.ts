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
import { Router } from '@angular/router';

import {
  UsersService,
  AdminUser,
  AdminDepartment,
  AdminRole,
  CreateUserRequest,
  UpdateUserRequest
} from '../../services/users';

interface UserForm {
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string;
  departmentId: number | null;
  roleId: number;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  readonly usersService = inject(UsersService);

  readonly users = signal<AdminUser[]>([]);
  readonly departments = signal<AdminDepartment[]>([]);
  readonly roles = signal<AdminRole[]>([]);

  readonly searchTerm = signal('');
  readonly selectedRoleId = signal(0);

  readonly showAddUser = signal(false);
  readonly showEditUser = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly showMessage = signal(false);

  readonly messageType = signal<'success' | 'error'>('error');
  readonly messageTitle = signal('');
  readonly messageText = signal('');

  selectedUserForDelete: AdminUser | null = null;

  newUser: UserForm = this.createEmptyForm();

  editUser: UserForm & { id: number } = {
    id: 0,
    ...this.createEmptyForm()
  };

  readonly totalUsers = computed(() => this.users().length);

  readonly activeUsers = computed(() =>
    this.users().filter(user => user.isActive).length
  );

  readonly inactiveUsers = computed(() =>
    this.users().filter(user => !user.isActive).length
  );

  readonly agentUsers = computed(() =>
    this.users().filter(user => user.roleName === 'IT Agent').length
  );

  readonly employeeUsers = computed(() =>
    this.users().filter(user => user.roleName === 'Employee').length
  );

  readonly adminUsers = computed(() =>
    this.users().filter(user => user.roleName === 'Admin').length
  );

  readonly filteredUsers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const roleId = this.selectedRoleId();

    return this.users().filter(user => {
      const matchesSearch =
        !search ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.departmentName?.toLowerCase().includes(search) ?? false) ||
        user.roleName.toLowerCase().includes(search);

      const matchesRole =
        roleId === 0 ||
        Number(user.roleId) === Number(roleId);

      return matchesSearch && matchesRole;
    });
  });

  readonly agentPercentage = computed(() =>
    this.getPercentage(this.agentUsers())
  );

  readonly employeePercentage = computed(() =>
    this.getPercentage(this.employeeUsers())
  );

  readonly adminPercentage = computed(() =>
    this.getPercentage(this.adminUsers())
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadUsers();
    this.loadDepartments();
    this.loadRoles();
  }

  private loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: users => this.users.set(users),
      error: error => this.showError(
        'Unable to Load Users',
        this.getErrorMessage(
          error,
          'Something went wrong while loading users.'
        )
      )
    });
  }

  private loadDepartments(): void {
    this.usersService.getDepartments().subscribe({
      next: departments => this.departments.set(departments),
      error: error => this.showError(
        'Unable to Load Departments',
        this.getErrorMessage(
          error,
          'Something went wrong while loading departments.'
        )
      )
    });
  }

  private loadRoles(): void {
    this.usersService.getRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: error => this.showError(
        'Unable to Load Roles',
        this.getErrorMessage(
          error,
          'Something went wrong while loading roles.'
        )
      )
    });
  }

  getSelectedRoleName(roleId: number): string {
    return this.roles().find(
      role => Number(role.id) === Number(roleId)
    )?.name?.trim() || '';
  }

  getDepartmentName(departmentId: number | null): string {
    if (!departmentId) {
      return 'N/A';
    }

    return this.departments().find(
      department => Number(department.id) === Number(departmentId)
    )?.name || 'N/A';
  }

  getRoleName(roleId: number): string {
    return this.roles().find(
      role => Number(role.id) === Number(roleId)
    )?.name || 'N/A';
  }

  isDepartmentRequired(roleId: number): boolean {
    return this.getSelectedRoleName(roleId).toLowerCase() === 'employee';
  }

  getPercentage(value: number): number {
    const total = this.totalUsers();
    return total ? Math.round((value / total) * 100) : 0;
  }

  onNewUserRoleChange(roleId: number): void {
    this.newUser.roleId = Number(roleId);

    if (!this.isDepartmentRequired(this.newUser.roleId)) {
      this.newUser.departmentId = null;
    }
  }

  onEditUserRoleChange(roleId: number): void {
    this.editUser.roleId = Number(roleId);

    if (!this.isDepartmentRequired(this.editUser.roleId)) {
      this.editUser.departmentId = null;
    }
  }

  openAddUser(): void {
    this.newUser = this.createEmptyForm();
    this.showAddUser.set(true);
  }

  closeAddUser(): void {
    this.showAddUser.set(false);
  }

  createUser(): void {
    if (!this.validateUser(this.newUser, false)) {
      return;
    }

    const request = this.buildUserRequest(
      this.newUser
    ) as CreateUserRequest;

    this.usersService.createUser(request).subscribe({
      next: user => {
        this.users.update(users => [...users, user]);
        this.closeAddUser();
        this.showSuccess(
          'User Created',
          'The new user has been created successfully.'
        );
      },
      error: error => this.showError(
        'Unable to Create User',
        this.getErrorMessage(
          error,
          'Something went wrong while creating the user.'
        )
      )
    });
  }

  openEditUser(user: AdminUser): void {
    this.editUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      passwordHash: '',
      phone: user.phone || '',
      departmentId: user.departmentId,
      roleId: Number(user.roleId),
      isActive: user.isActive
    };

    if (!this.isDepartmentRequired(this.editUser.roleId)) {
      this.editUser.departmentId = null;
    }

    this.showEditUser.set(true);
  }

  closeEditUser(): void {
    this.showEditUser.set(false);
  }

  updateUser(): void {
    if (!this.validateUser(this.editUser, true)) {
      return;
    }

    const request = this.buildUserRequest(
      this.editUser
    ) as UpdateUserRequest;

    this.usersService.updateUser(
      this.editUser.id,
      request
    ).subscribe({
      next: () => {
        this.users.update(users =>
          users.map(user =>
            user.id === this.editUser.id
              ? {
                  ...user,
                  fullName: request.fullName,
                  email: request.email,
                  phone: request.phone,
                  departmentId: request.departmentId,
                  departmentName: this.getDepartmentName(
                    request.departmentId
                  ),
                  roleId: request.roleId,
                  roleName: this.getRoleName(request.roleId),
                  isActive: request.isActive
                }
              : user
          )
        );

        this.closeEditUser();

        this.showSuccess(
          'User Updated',
          'The user information has been updated successfully.'
        );
      },
      error: error => this.showError(
        'Unable to Update User',
        this.getErrorMessage(
          error,
          'Something went wrong while updating the user.'
        )
      )
    });
  }

  toggleUserStatus(user: AdminUser): void {
    const isActive = !user.isActive;

    const request: UpdateUserRequest = {
      fullName: user.fullName,
      email: user.email,
      passwordHash: '',
      phone: user.phone,
      departmentId: user.departmentId,
      roleId: Number(user.roleId),
      isActive
    };

    this.usersService.updateUser(user.id, request).subscribe({
      next: () => {
        this.users.update(users =>
          users.map(currentUser =>
            currentUser.id === user.id
              ? { ...currentUser, isActive }
              : currentUser
          )
        );

        this.showSuccess(
          isActive ? 'User Activated' : 'User Deactivated',
          isActive
            ? `${user.fullName} has been activated successfully.`
            : `${user.fullName} has been deactivated successfully.`
        );
      },
      error: error => this.showError(
        'Unable to Update Status',
        this.getErrorMessage(
          error,
          'Something went wrong while updating the user status.'
        )
      )
    });
  }

  deleteUser(user: AdminUser): void {
    this.openDeleteConfirm(user);
  }

  openDeleteConfirm(user: AdminUser): void {
    this.selectedUserForDelete = user;
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.selectedUserForDelete = null;
  }

  confirmDeleteUser(): void {
    const user = this.selectedUserForDelete;

    if (!user) {
      return;
    }

    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(users =>
          users.filter(currentUser => currentUser.id !== user.id)
        );

        this.closeDeleteConfirm();

        this.showSuccess(
          'User Deleted',
          `${user.fullName} has been deleted successfully.`
        );
      },
      error: error => {
        this.closeDeleteConfirm();

        this.showError(
          'Unable to Delete User',
          this.getErrorMessage(
            error,
            'Something went wrong while deleting the user.'
          )
        );
      }
    });
  }

  private createEmptyForm(): UserForm {
    return {
      fullName: '',
      email: '',
      passwordHash: '',
      phone: '',
      departmentId: null,
      roleId: 0,
      isActive: true
    };
  }

  private validateUser(
    form: UserForm,
    isEdit: boolean
  ): boolean {
    if (!form.fullName.trim()) {
      this.showError(
        'Missing Full Name',
        'Please enter the user full name.'
      );
      return false;
    }

    if (!form.email.trim()) {
      this.showError(
        'Missing Email',
        'Please enter the user email address.'
      );
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      this.showError(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return false;
    }

    if (!isEdit && !form.passwordHash.trim()) {
      this.showError(
        'Missing Password',
        'Please enter a password.'
      );
      return false;
    }

    if (
      form.passwordHash.trim() &&
      form.passwordHash.length < 6
    ) {
      this.showError(
        'Invalid Password',
        'Password must contain at least 6 characters.'
      );
      return false;
    }

    if (!form.roleId) {
      this.showError(
        'Role Required',
        'Please select a role for this user.'
      );
      return false;
    }

    if (
      this.isDepartmentRequired(form.roleId) &&
      !form.departmentId
    ) {
      this.showError(
        'Department Required',
        'Please select a department for this employee.'
      );
      return false;
    }

    return true;
  }

  private buildUserRequest(
    form: UserForm
  ): CreateUserRequest | UpdateUserRequest {
    return {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      passwordHash: form.passwordHash,
      phone: form.phone.trim() || null,
      departmentId: this.isDepartmentRequired(form.roleId)
        ? form.departmentId
        : null,
      roleId: Number(form.roleId),
      isActive: form.isActive
    };
  }

  showError(title: string, message: string): void {
    this.messageType.set('error');
    this.messageTitle.set(title);
    this.messageText.set(message);
    this.showMessage.set(true);
  }

  showSuccess(title: string, message: string): void {
    this.messageType.set('success');
    this.messageTitle.set(title);
    this.messageText.set(message);
    this.showMessage.set(true);
  }

  closeMessage(): void {
    this.showMessage.set(false);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedRoleId.set(0);
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error
    ) {
      const response = (error as {
        error?: { message?: string };
      }).error;

      if (response?.message) {
        return response.message;
      }
    }

    return fallback;
  }
}
