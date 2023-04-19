import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { map, Observable, of, switchMap } from 'rxjs';
import {
  CountFlowsRequest,
  CreateFlowRequest,
  CreateFlowRunRequest,
  ExecutionOutputStatus,
  ExecutionState,
  FileId,
  Flow,
  FlowId,
  FlowOperationRequest,
  FlowRun,
  FlowVersionId,
  GuessFlowRequest,
  ListFlowsRequest,
  SeekPage,
} from '@activepieces/shared';
import { FlowTableDto } from '@activepieces/shared';
@Injectable({
  providedIn: 'root',
})
export class FlowService {
  constructor(private http: HttpClient) {}
  create(request: CreateFlowRequest): Observable<Flow> {
    return this.http.post<Flow>(environment.apiUrl + '/flows', {
      displayName: request.displayName,
    });
  }

  get(
    flowId: FlowId,
    flowVersionId: undefined | FlowVersionId
  ): Observable<Flow> {
    const params: Record<string, string> = {};
    if (flowVersionId) {
      params['versionId'] = flowVersionId;
    }
    return this.http.get<Flow>(environment.apiUrl + '/flows/' + flowId, {
      params: params,
    });
  }

  delete(flowId: FlowId): Observable<void> {
    return this.http.delete<void>(environment.apiUrl + '/flows/' + flowId);
  }

  list(request: ListFlowsRequest): Observable<SeekPage<FlowTableDto>> {
    const queryParams: { [key: string]: string | number } = {
      limit: request.limit ?? 10,
    };
    return this.http.get<SeekPage<FlowTableDto>>(
      environment.apiUrl + '/flows',
      {
        params: queryParams,
      }
    );
  }

  update(flowId: FlowId, opreation: FlowOperationRequest): Observable<Flow> {
    return this.http.post<Flow>(
      environment.apiUrl + '/flows/' + flowId,
      opreation
    );
  }

  execute(request: CreateFlowRunRequest): Observable<FlowRun> {
    return this.http
      .post<FlowRun>(environment.apiUrl + '/flow-runs', request)
      .pipe(
        switchMap((run) => {
          if (
            run.status !== ExecutionOutputStatus.RUNNING &&
            run.logsFileId !== null
          ) {
            return this.loadStateLogs(run.logsFileId).pipe(
              map((state) => {
                return { ...run, state: state };
              })
            );
          }
          return of(run);
        })
      );
  }

  loadStateLogs(fileId: FileId): Observable<ExecutionState> {
    return this.http.get<ExecutionState>(
      environment.apiUrl + `/files/${fileId}`
    );
  }

  guessFlow(prompt: string, newFlowName: string) {
    const request: GuessFlowRequest = {
      displayName: newFlowName,
      prompt: prompt,
    };
    return this.http.post<Flow>(environment.apiUrl + '/flows/guess', request);
  }

  count(req: CountFlowsRequest) {
    const params: Record<string, string | number | boolean> = {
      ...req,
    };
    return this.http.get<number>(environment.apiUrl + '/flows/count', {
      params: params,
    });
  }
}
