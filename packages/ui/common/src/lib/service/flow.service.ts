import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import {
  ApId,
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
  FlowVersion,
  FlowVersionId,
  ListFlowsRequest,
  MakeKeyNonNullableAndRequired,
  PopulatedFlow,
  SeekPage,
  TestFlowRunRequestBody,
  UpdateFlowStatusRequest,
} from '@activepieces/shared';
import { AuthenticationService } from './authentication.service';
export const CURRENT_FLOW_IS_NEW_KEY_IN_LOCAL_STORAGE = 'newFlow';
@Injectable({
  providedIn: 'root',
})
export class FlowService {
  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {}
  create(request: CreateFlowRequest): Observable<PopulatedFlow> {
    return this.http.post<PopulatedFlow>(environment.apiUrl + '/flows', {
      displayName: request.displayName,
      folderId: request.folderId,
      projectId: request.projectId,
    });
  }

  exportTemplate(
    flowId: FlowId,
    flowVersionId: undefined | FlowVersionId
  ): Observable<PopulatedFlow> {
    const params: Record<string, string> = {};
    if (flowVersionId) {
      params['versionId'] = flowVersionId;
    }
    return this.http.get<PopulatedFlow>(
      environment.apiUrl + '/flows/' + flowId + '/template',
      {
        params: params,
      }
    );
  }

  get(
    flowId: FlowId,
    flowVersionId?: FlowVersionId
  ): Observable<PopulatedFlow> {
    const params: Record<string, string> = {};
    if (flowVersionId) {
      params['versionId'] = flowVersionId;
    }
    return this.http.get<PopulatedFlow>(
      environment.apiUrl + '/flows/' + flowId,
      {
        params: params,
      }
    );
  }

  duplicate(flowId: FlowId): Observable<void> {
    return this.http
      .get<PopulatedFlow>(environment.apiUrl + '/flows/' + flowId)
      .pipe(
        switchMap((flow) => {
          return this.create({
            displayName: flow.version.displayName,
            projectId: this.authenticationService.getProjectId(),
          }).pipe(
            switchMap((clonedFlow) => {
              return this.update(clonedFlow.id, {
                type: FlowOperationType.IMPORT_FLOW,
                request: {
                  displayName: flow.version.displayName,
                  trigger: flow.version.trigger,
                },
              }).pipe(
                tap((clonedFlow: PopulatedFlow) => {
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

  list(request: ListFlowsRequest): Observable<SeekPage<PopulatedFlow>> {
    const queryParams: { [key: string]: string | number } = {
      limit: request.limit ?? 10,
      cursor: request.cursor || '',
    };
    queryParams['projectId'] = request.projectId;
    if (request.folderId) {
      queryParams['folderId'] = request.folderId;
    }
    return this.http.get<SeekPage<PopulatedFlow>>(
      environment.apiUrl + '/flows',
      {
        params: queryParams,
      }
    );
  }

  update(
    flowId: FlowId,
    operation: FlowOperationRequest
  ): Observable<PopulatedFlow> {
    return this.http.post<PopulatedFlow>(
      environment.apiUrl + '/flows/' + flowId,
      operation
    );
  }

  listVersions(flowId: FlowId): Observable<SeekPage<FlowVersion>> {
    return this.http.get<SeekPage<FlowVersion>>(
      environment.apiUrl + '/flows/' + flowId + '/versions'
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
  publish(request: {
    id: ApId;
  }): Observable<MakeKeyNonNullableAndRequired<Flow, 'publishedVersionId'>> {
    return this.http.post<
      MakeKeyNonNullableAndRequired<Flow, 'publishedVersionId'>
    >(
      environment.apiUrl + `/flows/${request.id}/published-version-id`,
      request
    );
  }

  updateStatus(
    flowId: ApId,
    request: UpdateFlowStatusRequest
  ): Observable<Flow> {
    return this.http.post<Flow>(
      environment.apiUrl + `/flows/${flowId}/status`,
      request
    );
  }
}
