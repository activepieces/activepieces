import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import {
  FlowRun,
  ListFlowRunsRequestQuery,
  SeekPage,
} from '@activepieces/shared';
import {
  CURSOR_QUERY_PARAM,
  DATE_RANGE_END_QUERY_PARAM,
  DATE_RANGE_START_QUERY_PARAM,
  FLOW_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
  STATUS_QUERY_PARAM,
} from '../utils/tables.utils';

@Injectable({
  providedIn: 'root',
})
export class InstanceRunService {
  constructor(private http: HttpClient) {}

  get(id: string): Observable<FlowRun> {
    return this.http.get<FlowRun>(environment.apiUrl + '/flow-runs/' + id);
  }

  list(
    projectId: string,
    params: ListFlowRunsRequestQuery
  ): Observable<SeekPage<FlowRun>> {
    const queryParams: { [key: string]: string | number } = {
      projectId: projectId,
    };
    if (params.status) {
      queryParams[STATUS_QUERY_PARAM] = params.status;
    }
    if (params.limit) {
      queryParams[LIMIT_QUERY_PARAM] = params.limit;
    }
    if (params.cursor) {
      queryParams[CURSOR_QUERY_PARAM] = params.cursor;
    }
    if (params.flowId) {
      queryParams[FLOW_QUERY_PARAM] = params.flowId;
    }
    if (params.createdBefore) {
      queryParams[DATE_RANGE_END_QUERY_PARAM] = params.createdBefore;
    }
    if (params.createdAfter) {
      queryParams[DATE_RANGE_START_QUERY_PARAM] = params.createdAfter;
    }
    return this.http.get<SeekPage<FlowRun>>(environment.apiUrl + `/flow-runs`, {
      params: queryParams,
    });
  }
}
