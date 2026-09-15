import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';


@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';


  constructor(
    private authService: AuthService,
    private router: Router
  ) {}


  login(): void {
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {

        this.authService.saveToken(response.token);

        this.authService.saveUser({
        userId: response.userId,
        fullName: response.fullName,
        email: response.email,
        role: response.role,
        profileImagePath: response.profileImagePath
        });

        if (response.role === 'Employee') {
          this.router.navigate(['/dashboard']);
          return;
        }


        if (response.role === 'IT Agent') {
          this.router.navigate(['/agent-dashboard']);
          return;
        }


        if (response.role === 'Admin') {
          this.router.navigate(['/admin-dashboard']);
        }
      },

      error: () => {
        // Login error is handled by the login UI.
      }
    });
  }
}