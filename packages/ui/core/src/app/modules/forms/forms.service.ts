import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FlowId, FormResponse } from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class FormsService {
  constructor(private http: HttpClient) {}

  submitForm(webhookUrl: string, request: FormData): Observable<FormResult> {
    return this.http.post<FormResult>(webhookUrl, request);
  }

  get(flowId: FlowId): Observable<FormResponse> {
    const params: Record<string, string> = {};
    return this.http.get<FormResponse>(
      environment.apiUrl + '/forms/' + flowId,
      {
        params: params,
      }
    );
  }

  getApprovalForm(flowId: string): Observable<FormResponse> {
    return this.http.get<FormResponse>(
      environment.apiUrl + '/forms/' + flowId + '/approval'
    );
  }

  submitApprovalForm(webhookUrl: string, isApproved: boolean): Observable<any> {
    return this.http.post(
      webhookUrl,
      {},
      {
        params: {
          action: isApproved ? 'approve' : 'disapprove',
        },
      }
    );
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
