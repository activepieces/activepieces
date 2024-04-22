import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
} from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  SeekPage,
  AppConnectionId,
  UpsertAppConnectionRequestBody,
  ListAppConnectionsRequestQuery,
  AppConnectionWithoutSensitiveData,
  ValidateConnectionNameRequestBody,
  ValidateConnectionNameResponse,
} from '@activepieces/shared';
import { CURSOR_QUERY_PARAM, LIMIT_QUERY_PARAM } from '../utils/tables.utils';
import { environment } from '../environments/environment';
import { AuthenticationService } from './authentication.service';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root',
})
export class AppConnectionsService {
  private connections$: Observable<AppConnectionWithoutSensitiveData[]>;
  public refreshCacheSubject: BehaviorSubject<void> = new BehaviorSubject<void>(
    undefined
  );

  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService,
    private projectService: ProjectService
  ) {
    this.connections$ = combineLatest({
      project: this.projectService.currentProject$,
      refreshCache: this.refreshCacheSubject,
    }).pipe(
      switchMap(({ project }) => {
        if (!project) {
          return [];
        }
        return this.list({ limit: 99999 }).pipe(map((res) => res.data));
      })
    );
  }
  upsert(
    request: UpsertAppConnectionRequestBody
  ): Observable<AppConnectionWithoutSensitiveData> {
    return this.http
      .post<AppConnectionWithoutSensitiveData>(
        environment.apiUrl + '/app-connections',
        request
      )
      .pipe(tap(() => this.refreshCacheSubject.next()));
  }

  getAllOnce(): Observable<AppConnectionWithoutSensitiveData[]> {
    return this.connections$.pipe(take(1));
  }

  getAllSubject(): Observable<AppConnectionWithoutSensitiveData[]> {
    return this.connections$;
  }

  getAllForPieceSubject(
    pieceName: string
  ): Observable<AppConnectionWithoutSensitiveData[]> {
    return this.connections$.pipe(
      map((connections) =>
        connections.filter((connection) => connection.pieceName === pieceName)
      )
    );
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
    if (params.name) {
      queryParams['name'] = params.name;
    }
    if (params.pieceName) {
      queryParams['pieceName'] = params.pieceName;
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
    return this.http
      .delete<void>(environment.apiUrl + '/app-connections/' + id)
      .pipe(
        tap(() => {
          this.refreshCacheSubject.next();
        })
      );
  }
  validateConnectionName(
    req: ValidateConnectionNameRequestBody
  ): Observable<ValidateConnectionNameResponse> {
    return this.http
      .post<ValidateConnectionNameResponse>(
        environment.apiUrl + '/app-connections/validate-connection-name',
        req
      )
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === HttpStatusCode.BadRequest) {
            return of(err.error);
          }
          throw err;
        })
      );
  }
}
