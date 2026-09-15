import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';


export interface TicketHistoryItem {

  id: number;

  ticketId: number;

  userId: number;

  userName: string;

  oldStatusId: number | null;

  oldStatusName: string | null;

  newStatusId: number | null;

  newStatusName: string | null;

  action: string;

  notes: string | null;

  createdAt: string;

}


@Injectable({
  providedIn: 'root'
})
export class TicketHistory {

  private apiUrl =
    'http://localhost:5058/api/tickethistory';


  constructor(
    private http: HttpClient
  ) {}


  getTicketHistory():
    Observable<TicketHistoryItem[]> {

    const token =
      localStorage.getItem('token');


    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });


    return this.http.get<TicketHistoryItem[]>(
      this.apiUrl,
      { headers }
    );

  }

}