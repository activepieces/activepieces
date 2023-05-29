import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  CodeExecutionResult,
  SeekPage,
  TriggerEvent,
} from '@activepieces/shared';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TestStepService {
  elevateResizer$: Subject<boolean> = new Subject();
  testingStepSectionIsRendered$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  constructor(private http: HttpClient) {}
  getTriggerEventsResults(flowId: string) {
    return this.http.get<SeekPage<TriggerEvent>>(
      environment.apiUrl + '/trigger-events',
      {
        params: {
          flowId: flowId,
        },
      }
    );
  }
  getPollingResults(flowId: string) {
    return this.http.get<SeekPage<TriggerEvent>>(
      environment.apiUrl + '/trigger-events/poll',
      {
        params: {
          flowId: flowId,
        },
      }
    );
  }
  testPieceOrCodeStep<T extends CodeExecutionResult | unknown>(req: {
    stepName: string;
    flowVersionId: string;
  }) {
    return this.http.post<{ output: T; success: boolean }>(
      environment.apiUrl + '/step-run',
      req
    );
  }
  startPieceWebhookSimulation(flowId: string) {
    return this.http.post<SeekPage<TriggerEvent>>(
      environment.apiUrl + '/webhook-simulation/',
      {
        flowId,
      }
    );
  }
  deletePieceWebhookSimulation(flowId: string) {
    return this.http.delete<SeekPage<TriggerEvent>>(
      environment.apiUrl + '/webhook-simulation/',
      {
        params: {
          flowId,
        },
      }
    );
  }
}
