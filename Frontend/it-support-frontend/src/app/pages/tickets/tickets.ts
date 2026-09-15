import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';

import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TicketsService, Ticket } from '../../services/tickets';

@Component({
  imports: [CommonModule],
  selector: 'app-tickets',
  styleUrl: './tickets.css',
  templateUrl: './tickets.html',
})
export class Tickets implements OnInit {

  tickets = signal<Ticket[]>([]);

  priorities = signal<any[]>([]);

  statuses = signal<any[]>([]);

  private platformId = inject(PLATFORM_ID);

  constructor(
    private ticketsService: TicketsService,
    private router: Router
  ) {}

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {

      // Load Tickets
      this.ticketsService.getTickets().subscribe({
        next: (data) => {

          this.tickets.set(data);

          console.log(
            'Tickets loaded:',
            data
          );
        },

        error: (error) => {
          console.error(
            'Failed to load tickets:',
            error
          );
        }
      });


      // Load Priorities
      this.ticketsService.getPriorities().subscribe({
        next: (data) => {

          this.priorities.set(data);

          console.log(
            'Priorities loaded:',
            data
          );
        },

        error: (error) => {
          console.error(
            'Failed to load priorities:',
            error
          );
        }
      });


      // Load Statuses
      this.ticketsService.getStatuses().subscribe({
        next: (data) => {

          this.statuses.set(data);

          console.log(
            'Statuses loaded:',
            data
          );
        },

        error: (error) => {
          console.error(
            'Failed to load statuses:',
            error
          );
        }
      });

    }

  }

  getPriorityName(priorityId: number): string {

    const priority = this.priorities().find(
      p => p.id === priorityId
    );

    return priority
      ? priority.name
      : 'Unknown';
  }

  getStatusName(statusId: number): string {

    const status = this.statuses().find(
      s => s.id === statusId
    );

    return status
      ? status.name
      : 'Unknown';
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  goToCreateTicket() {
    this.router.navigate(['/create-ticket']);
  }
  
  goToTicketDetails(ticketId: number) {
  this.router.navigate(['/ticket-details', ticketId]);
  }
}