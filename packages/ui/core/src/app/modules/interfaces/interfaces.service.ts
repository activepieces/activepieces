import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class InterfacesService {
  constructor(private http: HttpClient) {}

  submitInterface(
    webhookUrl: string,
    request: FormData
  ): Observable<InterfaceResult> {
    return this.http.post(webhookUrl, request) as Observable<InterfaceResult>;
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
