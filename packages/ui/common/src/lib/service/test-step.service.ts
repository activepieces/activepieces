import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, filter, take } from 'rxjs';
import {
  StepRunResponse,
  SeekPage,
  TriggerEvent,
  CreateStepRunRequestBody,
  apId,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { environment } from '../environments/environment';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root',
})
export class TestStepService {
  elevateResizer$: Subject<boolean> = new Subject();
  testingStepSectionIsRendered$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  constructor(
    private http: HttpClient,
    private websocketService: WebSocketService
  ) {}
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
  savePieceWebhookTriggerMockdata(flowId: string, mockData: unknown) {
    return this.http.post<TriggerEvent>(
      environment.apiUrl + '/trigger-events?flowId=' + flowId,
      mockData
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
  testPieceOrCodeStep(req: Omit<CreateStepRunRequestBody, 'id'>) {
    const id = apId();
    this.websocketService.socket.emit(WebsocketServerEvent.TEST_STEP_RUN, {
      ...req,
      id,
    });
    return this.websocketService.socket
      .fromEvent<StepRunResponse>(WebsocketClientEvent.TEST_STEP_FINISHED)
      .pipe(
        filter((response) => {
          return response.id === id;
        }),
        take(1)
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
