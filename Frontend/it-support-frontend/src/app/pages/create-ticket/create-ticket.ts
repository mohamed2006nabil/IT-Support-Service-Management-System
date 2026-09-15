import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { TicketsService } from '../../services/tickets';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-create-ticket',
  styleUrl: './create-ticket.css',
  templateUrl: './create-ticket.html',
})
export class CreateTicket {

  title = '';
  description = '';
  categoryId = 1;
  priorityId = 2;
  statusId = 1;

  // UI state using Angular Signals
  private creatingState = signal(false);
  private toastState = signal(false);

  get isCreating() {
    return this.creatingState();
  }

  set isCreating(value: boolean) {
    this.creatingState.set(value);
  }

  get showToast() {
    return this.toastState();
  }

  set showToast(value: boolean) {
    this.toastState.set(value);
  }

  toastType: 'success' | 'error' = 'success';

  constructor(
  private ticketsService: TicketsService,
  private location: Location
) {}

  createTicket() {

    if (this.isCreating) {
      return;
    }

    this.isCreating = true;
    this.showToast = false;

    const user = JSON.parse(
      localStorage.getItem('user') || '{}'
    );

    const ticket = {
      title: this.title,
      description: this.description,
      userId: user.userId,
      assignedToId: null,
      categoryId: this.categoryId,
      priorityId: this.priorityId,
      statusId: this.statusId
    };

    this.ticketsService.createTicket(ticket).subscribe({

      next: (response) => {

        console.log(
          'Ticket created successfully:',
          response
        );

        // Stop loading
        this.isCreating = false;

        // Show success toast
        this.toastType = 'success';
        this.showToast = true;

        // Clear form
        this.title = '';
        this.description = '';
        this.categoryId = 1;
        this.priorityId = 2;

        // Hide toast after 3 seconds
        setTimeout(() => {
          this.showToast = false;
        }, 3000);
      },

      error: (error) => {

        console.error(
          'Failed to create ticket:',
          error
        );

        // Stop loading
        this.isCreating = false;

        // Show error toast
        this.toastType = 'error';
        this.showToast = true;

        // Hide toast after 3 seconds
        setTimeout(() => {
          this.showToast = false;
        }, 3000);
      }

    });
  }

  closeToast() {
    this.showToast = false;
  }

 goBack() {
  this.location.back();
}
}