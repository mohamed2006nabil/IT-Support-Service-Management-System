import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';


export interface Attachment {

  id: number;

  ticketId: number;

  uploadedById: number;

  fileName: string;

  fileType: string | null;

  fileSize: number;

  uploadedAt: string;

}


@Injectable({
  providedIn: 'root'
})
export class AttachmentsService {

  private apiUrl =
    'http://localhost:5058/api/attachments';


  constructor(
    private http: HttpClient
  ) {}


  getAttachments(): Observable<Attachment[]> {

    const token =
      localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Attachment[]>(
      this.apiUrl,
      { headers }
    );

  }


  uploadAttachment(
    file: File,
    ticketId: number,
    uploadedById: number
  ): Observable<Attachment> {

    const token =
      localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });


    const formData =
      new FormData();

    formData.append(
      'file',
      file
    );

    formData.append(
      'ticketId',
      ticketId.toString()
    );

    formData.append(
      'uploadedById',
      uploadedById.toString()
    );


    return this.http.post<Attachment>(
      `${this.apiUrl}/upload`,
      formData,
      { headers }
    );

  }


  downloadAttachment(
    id: number
  ): Observable<Blob> {

    const token =
      localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get(
      `${this.apiUrl}/download/${id}`,
      {
        headers,
        responseType: 'blob'
      }
    );

  }


  deleteAttachment(
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