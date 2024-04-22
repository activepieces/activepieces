import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../environments/environment';
import {
  map,
  Observable,
  retry,
  switchMap,
  tap,
  throwError,
  timer,
} from 'rxjs';
import {
  CountFlowsRequest,
  CreateFlowRequest,
  FlowId,
  FlowOperationRequest,
  FlowOperationType,
  FlowRun,
  FlowTemplate,
  FlowVersion,
  FlowVersionId,
  ListFlowsRequest,
  PopulatedFlow,
  SeekPage,
  TestFlowRunRequestBody,
} from '@activepieces/shared';
import { AuthenticationService } from './authentication.service';
import { NavigationService } from './navigation.service';
@Injectable({
  providedIn: 'root',
})
export class FlowService {
  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService,
    private navigationService: NavigationService
  ) {}
  create(request: CreateFlowRequest): Observable<PopulatedFlow> {
    return this.http.post<PopulatedFlow>(environment.apiUrl + '/flows', {
      displayName: request.displayName,
      folderName: request.folderName,
      projectId: request.projectId,
    });
  }

  exportTemplate(
    flowId: FlowId,
    flowVersionId: undefined | FlowVersionId
  ): Observable<FlowTemplate> {
    const params: Record<string, string> = {};
    if (flowVersionId) {
      params['versionId'] = flowVersionId;
    }
    return this.http.get<FlowTemplate>(
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
                  this.navigationService.navigate({
                    route: [`/flows/${clonedFlow.id}`],
                    openInNewWindow: true,
                  });
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
    return this.http
      .post<PopulatedFlow>(environment.apiUrl + '/flows/' + flowId, operation)
      .pipe(
        retry({
          count: 3,
          delay: (error: HttpErrorResponse, retryCount: number) => {
            console.error(
              'Error occurred while updating flow',
              error,
              retryCount
            );
            switch (error.status) {
              case 0:
                return timer(3000);
              default:
                return throwError(() => error);
            }
          },
        })
      );
  }

  listVersions(flowId: FlowId): Observable<SeekPage<FlowVersion>> {
    return this.http.get<SeekPage<FlowVersion>>(
      environment.apiUrl + '/flows/' + flowId + '/versions'
    );
  }

  execute(request: TestFlowRunRequestBody): Observable<FlowRun> {
    return this.http.post<FlowRun>(
      environment.apiUrl + '/flow-runs/test',
      request
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
