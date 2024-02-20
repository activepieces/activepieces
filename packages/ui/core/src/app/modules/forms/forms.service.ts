import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FormsService {
  constructor(private http: HttpClient) {}

  submitForm(webhookUrl: string, request: FormData): Observable<FormResult> {
    return this.http.post(webhookUrl, request) as Observable<FormResult>;
  }
}

export type FormResult = {
  type: FormResultTypes;
  value: unknown;
};

export enum FormResultTypes {
  MARKDOWN = 'markdown',
  FILE = 'file',
}
