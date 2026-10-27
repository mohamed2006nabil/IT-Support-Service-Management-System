import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import { environment } from '../../environments/environment';

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  profileImagePath: string | null;
  departmentId: number | null;
  departmentName: string | null;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}


export interface AdminDepartment {
  id: number;
  name: string;
}


export interface AdminRole {
  id: number;
  name: string;
}


export interface CreateUserRequest {
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  departmentId: number | null;
  roleId: number;
  isActive: boolean;
}


export interface UpdateUserRequest {
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  departmentId: number | null;
  roleId: number;
  isActive: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private readonly http = inject(HttpClient);

  private readonly apiBaseUrl =
    `${environment.apiBaseUrl}/api`;

  private readonly serverBaseUrl =
    environment.apiBaseUrl;

  private readonly usersUrl =
    `${this.apiBaseUrl}/users`;

  private readonly departmentsUrl =
    `${this.apiBaseUrl}/departments`;

  private readonly rolesUrl =
    `${this.apiBaseUrl}/roles`;


  // =========================================================
  // Users
  // =========================================================

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(
      this.usersUrl
    );
  }


  getUser(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(
      `${this.usersUrl}/${id}`
    );
  }


  createUser(
    user: CreateUserRequest
  ): Observable<AdminUser> {
    return this.http.post<AdminUser>(
      this.usersUrl,
      user
    );
  }


  updateUser(
    id: number,
    user: UpdateUserRequest
  ): Observable<void> {
    return this.http.put<void>(
      `${this.usersUrl}/${id}`,
      user
    );
  }


  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.usersUrl}/${id}`
    );
  }


  // =========================================================
  // Departments
  // =========================================================

  getDepartments(): Observable<AdminDepartment[]> {
    return this.http.get<AdminDepartment[]>(
      this.departmentsUrl
    );
  }


  // =========================================================
  // Roles
  // =========================================================

  getRoles(): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(
      this.rolesUrl
    );
  }


  // =========================================================
  // Profile Images
  // =========================================================

  getProfileImageUrl(
    imagePath: string | null
  ): string | null {

    if (!imagePath) {
      return null;
    }

    // Support absolute URLs and backend-relative paths.
    if (
      imagePath.startsWith('https://') ||
      imagePath.startsWith('http://')
    ) {
      return imagePath;
    }

    const normalizedPath = imagePath.startsWith('/')
      ? imagePath
      : `/${imagePath}`;

    return `${this.serverBaseUrl}${normalizedPath}`;
  }

}