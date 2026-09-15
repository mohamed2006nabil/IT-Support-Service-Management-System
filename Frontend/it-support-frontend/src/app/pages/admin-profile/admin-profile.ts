import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  AuthService,
  UserProfile,
  UpdateProfileRequest
} from '../../services/auth';


@Component({
  selector: 'app-admin-profile',

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './admin-profile.html',
  styleUrl: './admin-profile.css'
})
export class AdminProfile implements OnInit {

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);


  // =========================================================
  // PROFILE STATE
  // =========================================================

  user =
    signal<UserProfile | null>(null);

  isEditing =
    signal(false);

  isSaving =
    signal(false);

  isUploadingPhoto =
    signal(false);


  // =========================================================
  // MESSAGES
  // =========================================================

  saveSuccess =
    signal(false);

  saveError =
    signal('');


  // =========================================================
  // PHOTO STATE
  // =========================================================

  selectedPhoto =
    signal<File | null>(null);

  photoPreview =
    signal<string | null>(null);

  hasPendingPhoto =
    signal(false);


  // =========================================================
  // EDIT PROFILE
  // =========================================================

  editProfile: UpdateProfileRequest = {
    fullName: '',
    email: '',
    phone: null
  };


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadProfile();

  }


  // =========================================================
  // LOAD PROFILE
  // =========================================================

  private loadProfile(): void {

    this.authService.getMe().subscribe({

      next: (profile) => {

        this.user.set(profile);

      },

      error: () => {

        this.router.navigate([
          '/admin/dashboard'
        ]);

      }

    });

  }


  // =========================================================
  // PHOTO URL
  // =========================================================

  getPhotoUrl(
    imagePath: string | null
  ): string | null {

    return this.authService
      .getProfileImageUrl(imagePath);

  }


  // =========================================================
  // START EDITING
  // =========================================================

  startEditing(): void {

    const currentUser =
      this.user();

    if (!currentUser) {
      return;
    }


    this.editProfile = {

      fullName:
        currentUser.fullName,

      email:
        currentUser.email,

      phone:
        currentUser.phone

    };


    this.saveSuccess.set(false);
    this.saveError.set('');

    this.isEditing.set(true);

  }


  // =========================================================
  // CANCEL PROFILE EDIT
  // =========================================================

  cancelEditing(): void {

    if (this.isSaving()) {
      return;
    }


    this.saveSuccess.set(false);
    this.saveError.set('');

    this.isEditing.set(false);

  }


  // =========================================================
  // SAVE PROFILE
  // =========================================================

  saveProfile(): void {

    if (this.isSaving()) {
      return;
    }


    const profile: UpdateProfileRequest = {

      fullName:
        this.editProfile.fullName.trim(),

      email:
        this.editProfile.email.trim(),

      phone:
        this.editProfile.phone?.trim() || null

    };


    if (!profile.fullName) {

      this.saveError.set(
        'Full name is required.'
      );

      return;

    }


    if (!profile.email) {

      this.saveError.set(
        'Email address is required.'
      );

      return;

    }


    if (!profile.phone) {

      this.saveError.set(
        'Phone number is required.'
      );

      return;

    }


    this.saveError.set('');
    this.saveSuccess.set(false);
    this.isSaving.set(true);


    this.authService
      .updateProfile(profile)
      .subscribe({

        next: (updatedProfile) => {

          this.user.set(
            updatedProfile
          );


          this.authService
            .updateCurrentUserProfile(
              updatedProfile
            );


          this.isEditing.set(false);

          this.isSaving.set(false);

          this.saveSuccess.set(true);

        },


        error: (error) => {

          this.isSaving.set(false);


          if (error.status === 409) {

            this.saveError.set(
              error.error?.message ||
              'Email address is already in use.'
            );

            return;

          }


          if (error.status === 400) {

            this.saveError.set(
              error.error?.message ||
              'Please check the information you entered.'
            );

            return;

          }


          this.saveError.set(
            'Unable to save your changes. Please try again.'
          );

        }

      });

  }


  // =========================================================
  // SELECT PHOTO
  // =========================================================

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


    // -------------------------------------------------------
    // Validate file type
    // -------------------------------------------------------

    const allowedTypes = [
      'image/jpeg',
      'image/png'
    ];


    if (!allowedTypes.includes(file.type)) {

      this.saveError.set(
        'Please select a JPG or PNG image.'
      );

      input.value = '';

      return;

    }


    // -------------------------------------------------------
    // Validate file size
    // -------------------------------------------------------

    const maxFileSize =
      2 * 1024 * 1024;


    if (file.size > maxFileSize) {

      this.saveError.set(
        'Image size must not exceed 2 MB.'
      );

      input.value = '';

      return;

    }


    // -------------------------------------------------------
    // Clear previous messages
    // -------------------------------------------------------

    this.saveError.set('');
    this.saveSuccess.set(false);


    // -------------------------------------------------------
    // Store selected file
    // -------------------------------------------------------

    this.selectedPhoto.set(file);


    // -------------------------------------------------------
    // Create preview
    // -------------------------------------------------------

    const previewUrl =
      URL.createObjectURL(file);


    this.photoPreview.set(
      previewUrl
    );


    // -------------------------------------------------------
    // Enter pending-photo state
    // -------------------------------------------------------

    this.hasPendingPhoto.set(true);


    // -------------------------------------------------------
    // Reset input
    // -------------------------------------------------------

    input.value = '';

  }


  // =========================================================
  // SAVE PHOTO
  // =========================================================

  savePhoto(): void {

    const file =
      this.selectedPhoto();


    if (!file) {
      return;
    }


    if (
      !this.hasPendingPhoto()
    ) {
      return;
    }


    if (
      this.isUploadingPhoto()
    ) {
      return;
    }


    this.isUploadingPhoto.set(true);

    this.saveError.set('');
    this.saveSuccess.set(false);


    this.authService
      .uploadProfilePhoto(file)
      .subscribe({

        next: (updatedProfile) => {

          // Update displayed profile
          this.user.set(
            updatedProfile
          );


          // Update stored user
          this.authService
            .updateCurrentUserProfile(
              updatedProfile
            );


          // Clear temporary state
          this.selectedPhoto.set(null);

          this.photoPreview.set(null);

          this.hasPendingPhoto.set(false);


          this.isUploadingPhoto.set(false);

          this.saveSuccess.set(true);

        },


        error: (error) => {

          this.isUploadingPhoto.set(false);


          this.saveError.set(
            error.error?.message ||
            'Unable to upload the photo. Please try again.'
          );

        }

      });

  }


  // =========================================================
  // CANCEL PHOTO
  // =========================================================

  cancelPhoto(): void {

    this.selectedPhoto.set(null);

    this.photoPreview.set(null);

    this.hasPendingPhoto.set(false);

    this.saveError.set('');

  }


  // =========================================================
  // CLEAR SAVED PHOTO
  // =========================================================

  clearPhoto(): void {

    const currentUser =
      this.user();


    if (!currentUser) {
      return;
    }


    if (
      !currentUser.profileImagePath
    ) {
      return;
    }


    if (
      this.isUploadingPhoto()
    ) {
      return;
    }


    this.isUploadingPhoto.set(true);

    this.saveError.set('');
    this.saveSuccess.set(false);


    this.authService
      .deleteProfilePhoto()
      .subscribe({

        next: (updatedProfile) => {

          // Update profile
          this.user.set(
            updatedProfile
          );


          // Update local storage
          this.authService
            .updateCurrentUserProfile(
              updatedProfile
            );


          // Clear any pending photo
          this.selectedPhoto.set(null);

          this.photoPreview.set(null);

          this.hasPendingPhoto.set(false);


          this.isUploadingPhoto.set(false);

          this.saveSuccess.set(true);

        },


        error: (error) => {

          this.isUploadingPhoto.set(false);


          this.saveError.set(
            error.error?.message ||
            'Unable to remove the photo. Please try again.'
          );

        }

      });

  }


  // =========================================================
  // BACK TO DASHBOARD
  // =========================================================

  goBack(): void {

    this.router.navigate([
      '/admin/dashboard'
    ]);

  }

}