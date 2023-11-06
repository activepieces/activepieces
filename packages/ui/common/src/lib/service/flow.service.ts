import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import {
  CountFlowsRequest,
  CreateFlowRequest,
  ExecutionOutputStatus,
  ExecutionState,
  FileId,
  Flow,
  FlowId,
  FlowOperationRequest,
  FlowOperationType,
  FlowRun,
  FlowVersionId,
  ListFlowsRequest,
  SeekPage,
  TestFlowRunRequestBody,
} from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class FlowService {
  constructor(private http: HttpClient) {}
  create(request: CreateFlowRequest): Observable<Flow> {
    return this.http.post<Flow>(environment.apiUrl + '/flows', {
      displayName: request.displayName,
      folderId: request.folderId,
    });
  }

  exportTemplate(
    flowId: FlowId,
    flowVersionId: undefined | FlowVersionId
  ): Observable<Flow> {
    const params: Record<string, string> = {};
    if (flowVersionId) {
      params['versionId'] = flowVersionId;
    }
    return this.http.get<Flow>(
      environment.apiUrl + '/flows/' + flowId + '/template',
      {
        params: params,
      }
    );
  }

  get(flowId: FlowId, flowVersionId?: FlowVersionId): Observable<Flow> {
    const params: Record<string, string> = {};
    if (flowVersionId) {
      params['versionId'] = flowVersionId;
    }
    return this.http.get<Flow>(environment.apiUrl + '/flows/' + flowId, {
      params: params,
    });
  }

  duplicate(flowId: FlowId): Observable<void> {
    return this.http.get<Flow>(environment.apiUrl + '/flows/' + flowId).pipe(
      switchMap((flow) => {
        return this.create({
          displayName: flow.version.displayName,
        }).pipe(
          switchMap((clonedFlow) => {
            return this.update(clonedFlow.id, {
              type: FlowOperationType.IMPORT_FLOW,
              request: {
                displayName: flow.version.displayName,
                trigger: flow.version.trigger,
              },
            }).pipe(
              tap((clonedFlow: Flow) => {
                window.open(`/flows/${clonedFlow.id}`, '_blank', 'noopener');
              })
            );
          }),
          map(() => void 0)
        );
      })
    );
  }

  delete(flowId: FlowId): Observable<void> {
    return this.http.delete<void>(environment.apiUrl + '/flows/' + flowId);
  }

  list(request: ListFlowsRequest): Observable<SeekPage<Flow>> {
    const queryParams: { [key: string]: string | number } = {
      limit: request.limit ?? 10,
      cursor: request.cursor || '',
    };
    if (request.folderId) {
      queryParams['folderId'] = request.folderId;
    }
    return this.http.get<SeekPage<Flow>>(environment.apiUrl + '/flows', {
      params: queryParams,
    });
  }

  update(flowId: FlowId, operation: FlowOperationRequest): Observable<Flow> {
    return this.http.post<Flow>(
      environment.apiUrl + '/flows/' + flowId,
      operation
    );
  }

  execute(request: TestFlowRunRequestBody): Observable<FlowRun> {
    return this.http
      .post<FlowRun>(environment.apiUrl + '/flow-runs/test', request)
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

  count(req: CountFlowsRequest) {
    const params: Record<string, string | number | boolean> = {};
    if (req.folderId) {
      params['folderId'] = req.folderId;
    }
    return this.http.get<number>(environment.apiUrl + '/flows/count', {
      params: params,
    });
  }
}
