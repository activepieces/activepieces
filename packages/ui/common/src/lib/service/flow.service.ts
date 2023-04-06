import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { map, Observable, of, switchMap } from 'rxjs';
import {
  CollectionId,
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
  SeekPage,
} from '@activepieces/shared';
@Injectable({
  providedIn: 'root',
})
export class FlowService {
  constructor(private http: HttpClient) {}
  create(request: CreateFlowRequest): Observable<Flow> {
    return this.http.post<Flow>(environment.apiUrl + '/flows', {
      displayName: request.displayName,
      collectionId: request.collectionId,
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

  listByCollection(collectionId: CollectionId): Observable<SeekPage<Flow>> {
    return this.http.get<SeekPage<Flow>>(environment.apiUrl + '/flows', {
      params: {
        limit: 100000,
        collectionId: collectionId,
      },
    });
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

  guessFlow(prompt: string, newFlowName: string, collectionId: string) {
    const request: GuessFlowRequest = {
      collectionId: collectionId,
      displayName: newFlowName,
      prompt: prompt,
    };
    return this.http.post<Flow>(environment.apiUrl + '/flows/guess', request);
  }
}
