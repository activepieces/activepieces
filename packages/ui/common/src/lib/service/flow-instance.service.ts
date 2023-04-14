import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import {
  FlowId,
  FlowInstance,
  UpdateFlowInstanceRequest,
  UpsertFlowInstanceRequest
} from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class FlowInstanceService {
  constructor(private http: HttpClient) {}

  publish(request: UpsertFlowInstanceRequest): Observable<FlowInstance> {
    return this.http.post<FlowInstance>(environment.apiUrl + `/flow-instances`, request);
  }

  updateStatus(
    flowId: FlowId,
    request: UpdateFlowInstanceRequest
  ): Observable<FlowInstance> {
    return this.http.post<FlowInstance>(
      environment.apiUrl + `/flow-instances/` + flowId,
      request
    );
  }

  get(flowId: FlowId): Observable<FlowInstance> {
    return this.http.get<FlowInstance>(environment.apiUrl + `/flow-instances`, {
      params: {
        flowId: flowId,
      },
    });
  }

  delete(flowId: FlowId): Observable<void> {
    return this.http.delete<void>(
      environment.apiUrl + `/flow-instances/${flowId}`
    );
  }
}