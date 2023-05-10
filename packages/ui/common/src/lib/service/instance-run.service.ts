import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { map, Observable, of, switchMap } from 'rxjs';
import { ExecutionOutput, FlowRun, SeekPage } from '@activepieces/shared';
import { CURSOR_QUERY_PARAM } from '../utils/tables.utils';

@Injectable({
  providedIn: 'root',
})
export class InstanceRunService {
  constructor(private http: HttpClient) {}

  get(id: string): Observable<FlowRun> {
    return this.http.get<FlowRun>(environment.apiUrl + '/flow-runs/' + id).pipe(
      switchMap((instanceRun) => {
        if (instanceRun.logsFileId !== null) {
          return this.logs(instanceRun.logsFileId).pipe(
            map((output) => {
              return { ...instanceRun, executionOutput: output } as FlowRun;
            })
          );
        }
        return of(instanceRun);
      })
    );
  }

  list(
    projectId: string,
    params: { limit: number; cursor: string }
  ): Observable<SeekPage<FlowRun>> {
    const queryParams: { [key: string]: string | number } = {
      limit: params.limit,
      projectId: projectId,
    };
    if (params.cursor) {
      queryParams[CURSOR_QUERY_PARAM] = params.cursor;
    }
    return this.http.get<SeekPage<FlowRun>>(environment.apiUrl + `/flow-runs`, {
      params: queryParams,
    });
  }

  private logs(fileId: string): Observable<ExecutionOutput> {
    return this.http.get<ExecutionOutput>(
      environment.apiUrl + `/files/${fileId}`
    );
  }
}
