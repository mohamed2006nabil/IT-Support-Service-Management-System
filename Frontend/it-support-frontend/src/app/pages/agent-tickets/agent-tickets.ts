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

import { Router } from '@angular/router';

import {
  TicketsService,
  Ticket
} from '../../services/tickets';

@Component({
  imports: [CommonModule],
  selector: 'app-agent-tickets',
  styleUrl: './agent-tickets.css',
  templateUrl: './agent-tickets.html',
})
export class AgentTickets implements OnInit {

  tickets = signal<Ticket[]>([]);

  private platformId = inject(PLATFORM_ID);

  constructor(
    private ticketsService: TicketsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {

      this.ticketsService.getTickets().subscribe({
        next: (data) => {

          this.tickets.set(data);

          console.log(
            'Agent tickets loaded:',
            data
          );

        },

        error: (error) => {

          console.error(
            'Failed to load agent tickets:',
            error
          );

        }
      });

    }
  }

  goToTicketDetails(ticketId: number) {
    this.router.navigate([
      '/agent-ticket-details',
      ticketId
    ]);
  }

  goBack() {
    this.router.navigate([
      '/agent-dashboard'
    ]);
  }

}