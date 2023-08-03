import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SeekPage,
  AppConnectionId,
  AppConnection,
  UpsertConnectionRequest,
  ListAppConnectionRequest,
} from '@activepieces/shared';
import { CURSOR_QUERY_PARAM, LIMIT_QUERY_PARAM } from '../utils/tables.utils';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppConnectionsService {
  constructor(private http: HttpClient) {}

  upsert(request: UpsertConnectionRequest): Observable<AppConnection> {
    return this.http.post<AppConnection>(
      environment.apiUrl + '/app-connections',
      request
    );
  }

  list(params: ListAppConnectionRequest): Observable<SeekPage<AppConnection>> {
    const queryParams: { [key: string]: string | number } = {};
    if (params.cursor) {
      queryParams[CURSOR_QUERY_PARAM] = params.cursor;
    }
    if (params.limit) {
      queryParams[LIMIT_QUERY_PARAM] = params.limit;
    }
    return this.http.get<SeekPage<AppConnection>>(
      environment.apiUrl + '/app-connections',
      {
        params: queryParams,
      }
    );
  }

  getConnectionNameSuggest(pieceName: string) {
    return pieceName
      .replace('@activepieces/piece-', '')
      .replace(/[^A-Za-z0-9_\\-]/g, '_');
  }

  delete(id: AppConnectionId): Observable<void> {
    return this.http.delete<void>(
      environment.apiUrl + '/app-connections/' + id
    );
  }
}
