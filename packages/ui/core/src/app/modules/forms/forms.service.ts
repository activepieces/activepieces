import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  FlowId,
  FormResponse,
  USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class FormsService {
  constructor(private http: HttpClient) {}

  submitForm(
    webhookUrl: string,
    request: Record<string, unknown>
  ): Observable<FormResult | null> {
    return this.http.post<FormResult | null>(webhookUrl, request);
  }

  get(flowId: FlowId, useDraft?: boolean): Observable<FormResponse> {
    return this.http.get<FormResponse>(
      `${environment.apiUrl}/forms/${flowId}?${USE_DRAFT_QUERY_PARAM_NAME}=${useDraft}`
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
