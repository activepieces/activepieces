import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class InterfacesService {
  constructor(private http: HttpClient) {}

  submitInterface(webhookUrl: string, request: FormData): Observable<any> {
    return this.http.post(webhookUrl, request);
  }
}

export type InterfaceResult = {
  type: InterfaceResultTypes;
  value: unknown;
};

export enum InterfaceResultTypes {
  MARKDOWN = 'markdown',
  FILE = 'file',
}
