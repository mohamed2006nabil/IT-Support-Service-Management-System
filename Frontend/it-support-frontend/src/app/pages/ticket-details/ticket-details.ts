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
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  TicketsService,
  Ticket
} from '../../services/tickets';

@Component({
  imports: [CommonModule],
  selector: 'app-ticket-details',
  styleUrl: './ticket-details.css',
  templateUrl: './ticket-details.html',
})
export class TicketDetails implements OnInit {

  ticket = signal<Ticket | null>(null);

  private platformId = inject(PLATFORM_ID);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketsService: TicketsService
  ) {}

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {

      const ticketId = Number(
        this.route.snapshot.paramMap.get('id')
      );

      if (!ticketId) {
        this.router.navigate(['/tickets']);
        return;
      }

      this.ticketsService.getTicketById(ticketId).subscribe({

        next: (data) => {
          this.ticket.set(data);

          console.log(
            'Ticket details loaded:',
            data
          );
        },

        error: (error) => {

          console.error(
            'Failed to load ticket details:',
            error
          );

          this.router.navigate(['/tickets']);
        }

      });

    }

  }

  goBack() {
    this.router.navigate(['/tickets']);
  }

}