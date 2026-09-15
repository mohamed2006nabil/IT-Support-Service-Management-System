import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';


/**
 * Represents the authenticated user stored by the application.
 */
export interface User {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  profileImagePath: string | null;
}


/**
 * Response returned by the authentication endpoint.
 */
export interface LoginResponse extends User {
  message: string;
  token: string;
}


/**
 * Complete profile information returned by the API.
 */
export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  profileImagePath: string | null;
}


/**
 * Data required to update the current user's profile.
 */
export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  phone: string | null;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);


  // =========================================================
  // API Configuration
  // =========================================================

  private readonly apiBaseUrl =
    'http://localhost:5058';

  private readonly authApiUrl =
    `${this.apiBaseUrl}/api/auth`;


  // =========================================================
  // Local Storage Keys
  // =========================================================

  private readonly userStorageKey = 'user';

  private readonly tokenStorageKey = 'token';


  // =========================================================
  // Authenticated User State
  // =========================================================

  readonly currentUser =
    signal<User | null>(
      this.getStoredUser()
    );


  // =========================================================
  // Authentication
  // =========================================================

  login(
    email: string,
    password: string
  ): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.authApiUrl}/login`,
      {
        email,
        password
      }
    );
  }


  // =========================================================
  // Current User Profile
  // =========================================================

  getMe(): Observable<UserProfile> {

    return this.http.get<UserProfile>(
      `${this.authApiUrl}/me`
    );
  }


  updateProfile(
    profile: UpdateProfileRequest
  ): Observable<UserProfile> {

    return this.http.put<UserProfile>(
      `${this.authApiUrl}/me`,
      profile
    );
  }


  // =========================================================
  // Profile Photo
  // =========================================================

  uploadProfilePhoto(
    file: File
  ): Observable<UserProfile> {

    const formData = new FormData();

    formData.append(
      'file',
      file
    );

    return this.http.post<UserProfile>(
      `${this.authApiUrl}/profile-photo`,
      formData
    );
  }


  deleteProfilePhoto():
    Observable<UserProfile> {

    return this.http.delete<UserProfile>(
      `${this.authApiUrl}/profile-photo`
    );
  }


  getProfileImageUrl(
    imagePath: string | null
  ): string | null {

    if (!imagePath) {
      return null;
    }

    return `${this.apiBaseUrl}${imagePath}`;
  }


  // =========================================================
  // User State Management
  // =========================================================

  saveUser(user: User): void {

    localStorage.setItem(
      this.userStorageKey,
      JSON.stringify(user)
    );

    this.currentUser.set(user);
  }


  updateCurrentUserProfile(
    profile: UserProfile
  ): void {

    const updatedUser: User = {
      userId: profile.userId,
      fullName: profile.fullName,
      email: profile.email,
      role: profile.role,
      profileImagePath:
        profile.profileImagePath
    };

    this.saveUser(updatedUser);
  }


  // =========================================================
  // Token Management
  // =========================================================

  saveToken(token: string): void {

    localStorage.setItem(
      this.tokenStorageKey,
      token
    );
  }


  logout(): void {

    localStorage.removeItem(
      this.tokenStorageKey
    );

    localStorage.removeItem(
      this.userStorageKey
    );

    this.currentUser.set(null);
  }


  // =========================================================
  // Storage
  // =========================================================

  private getStoredUser():
    User | null {

    const storedUser =
      localStorage.getItem(
        this.userStorageKey
      );

    if (!storedUser) {
      return null;
    }

    try {

      return JSON.parse(
        storedUser
      ) as User;

    } catch {

      return null;

    }
  }

}