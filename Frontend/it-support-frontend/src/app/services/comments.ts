import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';

export interface Comment {
  id: number;
  ticketId: number;
  userId: number;
  commentText: string;
  createdAt: string;
  userName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {

  private apiUrl =
    'http://localhost:5058/api/comments';

  constructor(
    private http: HttpClient
  ) {}

  getComments(): Observable<Comment[]> {

    const token =
      localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Comment[]>(
      this.apiUrl,
      { headers }
    );
  }

  addComment(
    ticketId: number,
    userId: number,
    commentText: string
  ): Observable<Comment> {

    const token =
      localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<Comment>(
      this.apiUrl,
      {
        ticketId: ticketId,
        userId: userId,
        commentText: commentText
      },
      { headers }
    );
  }

  deleteComment(
    id: number
  ): Observable<void> {

    const token =
      localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { headers }
    );
  }

}