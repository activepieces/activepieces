import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApId, FlowId } from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class FormsService {
  constructor(private http: HttpClient) {}

  submitForm(webhookUrl: string, request: FormData): Observable<FormResult> {
    return this.http.post(webhookUrl, request) as Observable<FormResult>;
  }

  get(flowId: FlowId): Observable<PopulatedForm> {
    const params: Record<string, string> = {};
    return this.http.get<PopulatedForm>(
      environment.apiUrl + '/forms/' + flowId,
      {
        params: params,
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

export type Input = {
  displayName: string;
  required: boolean;
  description: string;
  type: InputTypes;
};

export enum InputTypes {
  TEXT = 'text',
  FILE = 'file',
  TEXT_AREA = 'text_area',
  TOGGLE = 'toggle',
}

export type FormProps = {
  inputs: Input[];
  waitForResponse: boolean;
};

export type PopulatedForm = {
  id: ApId;
  triggerName: string;
  title: string;
  projectId: string;
  props: FormProps;
};
