import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SeekPage, TriggerEvent } from '@activepieces/shared';
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
  testPieceStep(req: {
    stepName: string;
    collectionId: string;
    flowVersionId: string;
  }) {
    return this.http.post<unknown>(environment.apiUrl + '/step-run', req);
  }
}
