import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  userId: number;
  assignedToId: number | null;
  categoryId: number;
  priorityId: number;
  statusId: number;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TicketsService {

  private apiUrl =
    `${environment.apiBaseUrl}/api/tickets`;

  constructor(private http: HttpClient) {}

  getTickets(): Observable<Ticket[]> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Ticket[]>(
      this.apiUrl,
      { headers }
    );
  }

  createTicket(ticket: any): Observable<Ticket> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<Ticket>(
      this.apiUrl,
      ticket,
      { headers }
    );
  }

  getPriorities(): Observable<any[]> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/api/priorities`,
      { headers }
    );
  }

  getStatuses(): Observable<any[]> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/api/statuses`,
      { headers }
    );
  }

  getTicketById(id: number): Observable<Ticket> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Ticket>(
      `${this.apiUrl}/${id}`,
      { headers }
    );
  }

  updateTicket(
    id: number,
    ticket: any
  ): Observable<Ticket> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put<Ticket>(
      `${this.apiUrl}/${id}`,
      ticket,
      { headers }
    );
  }

}