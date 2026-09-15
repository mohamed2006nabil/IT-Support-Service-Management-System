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
  TicketHistory,
  TicketHistoryItem
} from '../../services/ticket-history';


@Component({
  selector: 'app-agent-ticket-history',

  imports: [
    CommonModule
  ],

  templateUrl: './agent-ticket-history.html',

  styleUrl: './agent-ticket-history.css'
})
export class AgentTicketHistory implements OnInit {


  history =
    signal<TicketHistoryItem[]>([]);


  private platformId =
    inject(PLATFORM_ID);


  constructor(
    private ticketHistoryService:
      TicketHistory,

    private router:
      Router
  ) {}


  ngOnInit(): void {

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      this.ticketHistoryService
        .getTicketHistory()
        .subscribe({

          next: (data) => {

            this.history.set(
              data
            );

            console.log(
              'Agent ticket history loaded:',
              data
            );

          },

          error: (error) => {

            console.error(
              'Failed to load agent ticket history:',
              error
            );

          }

        });

    }

  }


  goBack() {

    this.router.navigate([
      '/agent-dashboard'
    ]);

  }

}