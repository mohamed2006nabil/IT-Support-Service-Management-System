import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id: number;
  userId: number;
  ticketId: number | null;
  title: string;
  message: string;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  private apiUrl = 'http://localhost:5058/api/notifications';

  constructor(private http: HttpClient) {}

  // Get Notifications
  getNotifications(): Observable<Notification[]> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Notification[]>(
      this.apiUrl,
      { headers }
    );
  }

  // Mark Notification as Read
  markAsRead(id: number): Observable<any> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(
      `${this.apiUrl}/${id}/read`,
      {},
      { headers }
    );
  }
markAllAsRead(): Observable<any> {
  const token = localStorage.getItem('token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.put(
    `${this.apiUrl}/read-all`,
    {},
    { headers }
  );
}
}