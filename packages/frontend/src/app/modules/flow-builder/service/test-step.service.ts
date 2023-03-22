import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { SeekPage, TriggerEvent } from '@activepieces/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TestStepService {
  elevateResizer$: Subject<boolean> = new Subject();
  constructor(private http: HttpClient) {}
  getWebhookResults(flowId: string) {
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
    return this.http.get<SeekPage<TriggerEvent>>(environment.apiUrl + '/poll', {
      params: {
        flowId: flowId,
      },
    });
  }
}
