import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import {
  SeekPage,
  AppConnectionId,
  UpsertAppConnectionRequestBody,
  ListAppConnectionsRequestQuery,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { CURSOR_QUERY_PARAM, LIMIT_QUERY_PARAM } from '../utils/tables.utils';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppConnectionsService {
  constructor(private http: HttpClient) {}
  private _newConnectionCreated$: Subject<boolean> = new Subject();
  upsert(
    request: UpsertAppConnectionRequestBody
  ): Observable<AppConnectionWithoutSensitiveData> {
    return this.http
      .post<AppConnectionWithoutSensitiveData>(
        environment.apiUrl + '/app-connections',
        request
      )
      .pipe(tap(() => this._newConnectionCreated$.next(true)));
  }

  list(
    params: ListAppConnectionsRequestQuery
  ): Observable<SeekPage<AppConnectionWithoutSensitiveData>> {
    const queryParams: { [key: string]: string | number } = {};
    if (params.cursor) {
      queryParams[CURSOR_QUERY_PARAM] = params.cursor;
    }
    if (params.limit) {
      queryParams[LIMIT_QUERY_PARAM] = params.limit;
    }
    queryParams['projectId'] = params.projectId;
    return this.http.get<SeekPage<AppConnectionWithoutSensitiveData>>(
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
  get newConnectionCreated$() {
    return this._newConnectionCreated$.asObservable();
  }
}
