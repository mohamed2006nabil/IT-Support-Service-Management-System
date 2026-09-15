import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal
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


export interface AgentProfile {
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  profileImagePath: string | null;
}


interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
}


@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './agent-profile.html',
  styleUrl: './agent-profile.css'
})
export class AgentProfile implements OnInit {

  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly usersService =
    inject(UsersService);

  private readonly apiUrl = 'http://localhost:5058/api/auth';

  


  user =
    signal<AgentProfile | null>(null);

  isEditing =
    signal(false);

  isSaving =
    signal(false);

  isUploadingPhoto =
    signal(false);

  saveSuccess =
    signal(false);

  saveError =
    signal('');


  selectedPhoto =
    signal<File | null>(null);

  photoPreview =
    signal<string | null>(null);

  profileImageLoadFailed =
    false;


  editProfile: ProfileForm = {
    fullName: '',
    email: '',
    phone: ''
  };


  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}


  ngOnInit(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return;
    }

    this.loadProfile();

  }


  private getHeaders(): HttpHeaders {

    const token =
      localStorage.getItem('token');

    return new HttpHeaders({
      Authorization:
        `Bearer ${token}`
    });

  }


  private loadProfile(): void {

    this.saveError.set('');

    this.http
      .get<AgentProfile>(
        `${this.apiUrl}/me`,
        {
          headers: this.getHeaders()
        }
      )
      .subscribe({

        next: profile => {

          this.user.set(profile);

          this.editProfile = {
            fullName:
              profile.fullName || '',
            email:
              profile.email || '',
            phone:
              profile.phone || ''
          };

          this.profileImageLoadFailed =
            false;

          this.syncLocalUser(profile);

        },

        error: error => {

          console.error(
            'Failed to load agent profile:',
            error
          );

          this.saveError.set(
            this.getErrorMessage(
              error,
              'Unable to load your profile.'
            )
          );

        }

      });

  }


  startEditing(): void {

    const profile =
      this.user();

    if (!profile) {
      return;
    }

    this.editProfile = {
      fullName:
        profile.fullName || '',
      email:
        profile.email || '',
      phone:
        profile.phone || ''
    };

    this.saveSuccess.set(false);
    this.saveError.set('');
    this.isEditing.set(true);

  }


  cancelEditing(): void {

    if (this.isSaving()) {
      return;
    }

    const profile =
      this.user();

    if (profile) {
      this.editProfile = {
        fullName:
          profile.fullName || '',
        email:
          profile.email || '',
        phone:
          profile.phone || ''
      };
    }

    this.isEditing.set(false);
    this.saveError.set('');

  }


  saveProfile(): void {

    if (this.isSaving()) {
      return;
    }

    const fullName =
      this.editProfile.fullName.trim();

    const email =
      this.editProfile.email.trim();

    const phone =
      this.editProfile.phone.trim();

    if (!fullName) {
      this.saveError.set(
        'Full name is required.'
      );
      return;
    }

    if (!this.isValidEmail(email)) {
      this.saveError.set(
        'Please enter a valid email address.'
      );
      return;
    }

    if (!phone) {
      this.saveError.set(
        'Phone number is required.'
      );
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);

    this.http
      .put<AgentProfile>(
        `${this.apiUrl}/me`,
        {
          fullName,
          email,
          phone
        },
        {
          headers: this.getHeaders()
        }
      )
      .subscribe({

        next: profile => {

          this.user.set(profile);

          this.editProfile = {
            fullName:
              profile.fullName || '',
            email:
              profile.email || '',
            phone:
              profile.phone || ''
          };

          this.syncLocalUser(profile);

          this.isEditing.set(false);
          this.isSaving.set(false);
          this.saveSuccess.set(true);

          this.clearSuccessLater();

        },

        error: error => {

          console.error(
            'Failed to update agent profile:',
            error
          );

          this.isSaving.set(false);

          this.saveError.set(
            this.getErrorMessage(
              error,
              'Unable to update your profile.'
            )
          );

        }

      });

  }


  onPhotoSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {

      this.saveError.set(
        'Only JPG and PNG images are allowed.'
      );

      input.value = '';
      return;

    }

    const maxSize =
      2 * 1024 * 1024;

    if (file.size > maxSize) {

      this.saveError.set(
        'Image size must not exceed 2 MB.'
      );

      input.value = '';
      return;

    }

    this.saveError.set('');
    this.saveSuccess.set(false);

    this.selectedPhoto.set(file);

    const reader =
      new FileReader();

    reader.onload = () => {

      this.photoPreview.set(
        typeof reader.result === 'string'
          ? reader.result
          : null
      );

    };

    reader.readAsDataURL(file);

  }


  savePhoto(): void {

    const file =
      this.selectedPhoto();

    if (!file || this.isUploadingPhoto()) {
      return;
    }

    const formData =
      new FormData();

    formData.append(
      'file',
      file,
      file.name
    );

    this.isUploadingPhoto.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);

    this.http
      .post<AgentProfile>(
        `${this.apiUrl}/profile-photo`,
        formData,
        {
          headers: this.getHeaders()
        }
      )
      .subscribe({

        next: profile => {

          this.user.set(profile);

          this.syncLocalUser(profile);

          this.selectedPhoto.set(null);
          this.photoPreview.set(null);
          this.profileImageLoadFailed = false;

          this.isUploadingPhoto.set(false);
          this.saveSuccess.set(true);

          this.clearSuccessLater();

        },

        error: error => {

          console.error(
            'Failed to upload agent profile photo:',
            error
          );

          this.isUploadingPhoto.set(false);

          this.saveError.set(
            this.getErrorMessage(
              error,
              'Unable to upload your profile photo.'
            )
          );

        }

      });

  }


  cancelPhoto(): void {

    if (this.isUploadingPhoto()) {
      return;
    }

    this.selectedPhoto.set(null);
    this.photoPreview.set(null);

  }


  clearPhoto(): void {

    if (this.isUploadingPhoto()) {
      return;
    }

    this.isUploadingPhoto.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);

    this.http
      .delete<AgentProfile>(
        `${this.apiUrl}/profile-photo`,
        {
          headers: this.getHeaders()
        }
      )
      .subscribe({

        next: profile => {

          this.user.set(profile);

          this.syncLocalUser(profile);

          this.selectedPhoto.set(null);
          this.photoPreview.set(null);
          this.profileImageLoadFailed = false;

          this.isUploadingPhoto.set(false);
          this.saveSuccess.set(true);

          this.clearSuccessLater();

        },

        error: error => {

          console.error(
            'Failed to remove agent profile photo:',
            error
          );

          this.isUploadingPhoto.set(false);

          this.saveError.set(
            this.getErrorMessage(
              error,
              'Unable to remove your profile photo.'
            )
          );

        }

      });

  }


  getPhotoUrl(
    imagePath: string | null
  ): string {

    return this.usersService
      .getProfileImageUrl(
        imagePath
      ) || '';

  }


  handleProfileImageError(): void {

    this.profileImageLoadFailed = true;

  }


  initial(): string {

    const name =
      this.user()?.fullName?.trim();

    if (!name) {
      return 'A';
    }

    return name
      .charAt(0)
      .toUpperCase();

  }


  goBack(): void {

    this.router.navigate([
      '/agent-dashboard'
    ]);

  }


  private syncLocalUser(
    profile: AgentProfile
  ): void {

    const raw =
      localStorage.getItem('user');

    let localUser: Record<string, unknown> =
      {};

    if (raw) {

      try {

        localUser =
          JSON.parse(raw) as Record<string, unknown>;

      } catch {

        localUser = {};

      }

    }

    localUser['userId'] =
      profile.userId;

    localUser['fullName'] =
      profile.fullName;

    localUser['email'] =
      profile.email;

    localUser['phone'] =
      profile.phone;

    localUser['role'] =
      profile.role;

    localUser['profileImagePath'] =
      profile.profileImagePath;

    localStorage.setItem(
      'user',
      JSON.stringify(localUser)
    );

  }


  private isValidEmail(
    email: string
  ): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);

  }


  private getErrorMessage(
    error: any,
    fallback: string
  ): string {

    return (
      error?.error?.message ||
      error?.error?.title ||
      fallback
    );

  }


  private clearSuccessLater(): void {

    setTimeout(() => {
      this.saveSuccess.set(false);
    }, 3500);

  }

}
