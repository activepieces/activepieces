import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, map, tap } from 'rxjs';
import {
  SeekPage,
  AppConnectionId,
  UpsertAppConnectionRequestBody,
  ListAppConnectionsRequestQuery,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { CURSOR_QUERY_PARAM, LIMIT_QUERY_PARAM } from '../utils/tables.utils';
import { environment } from '../environments/environment';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class AppConnectionsService {
  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {}
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

  getAll(): Observable<AppConnectionWithoutSensitiveData[]> {
    return this.list({ limit: 99999 }).pipe(map((res) => res.data));
  }

  list(
    params: Omit<ListAppConnectionsRequestQuery, 'projectId'>
  ): Observable<SeekPage<AppConnectionWithoutSensitiveData>> {
    const queryParams: { [key: string]: string | number } = {};
    if (params.cursor) {
      queryParams[CURSOR_QUERY_PARAM] = params.cursor;
    }
    if (params.limit) {
      queryParams[LIMIT_QUERY_PARAM] = params.limit;
    }
    queryParams['projectId'] = this.authenticationService.getProjectId()!;
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
