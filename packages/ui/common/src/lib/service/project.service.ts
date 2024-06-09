import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import {
  ListProjectRequestForUserQueryParams,
  ProjectId,
  ProjectWithLimits,
  SeekPage,
} from '@activepieces/shared';
import {
  CreatePlatformProjectRequest,
  UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared';
import { environment } from '../environments/environment';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private refreshSubject = new BehaviorSubject<void>(undefined);
  public currentProject$: Observable<ProjectWithLimits | null>;

  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {
    this.currentProject$ = this.authenticationService.tokenChangedSubject.pipe(
      switchMap(() => {
        const projectId = this.authenticationService.getProjectId();
        if (!projectId) {
          return of(null);
        }
        return this.refreshSubject.pipe(
          switchMap(() =>
            this.http
              .get<ProjectWithLimits>(
                environment.apiUrl + '/users/projects/' + projectId
              )
              .pipe(
                shareReplay(1),
                catchError(() => {
                  return of(null);
                })
              )
          ),
          catchError(() => of(null))
        );
      })
    );
  }

  create(req: CreatePlatformProjectRequest) {
    return this.http.post<ProjectWithLimits>(
      environment.apiUrl + '/projects/',
      req
    );
  }

  update(
    projectId: ProjectId,
    request: UpdateProjectPlatformRequest
  ): Observable<ProjectWithLimits> {
    return this.http
      .post<ProjectWithLimits>(
        environment.apiUrl + '/projects/' + projectId,
        request
      )
      .pipe(
        tap(() => {
          this.refreshSubject.next();
        })
      );
  }

  // TODO: paginate the results
  getAll(): Observable<ProjectWithLimits[]> {
    return this.list({ limit: 100 }).pipe(map((res) => res.data));
  }

  list(
    request: ListProjectRequestForUserQueryParams
  ): Observable<SeekPage<ProjectWithLimits>> {
    return this.http.get<SeekPage<ProjectWithLimits>>(
      environment.apiUrl + `/users/projects`,
      {
        params: request,
      }
    );
  }

  delete(projectId: ProjectId): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/projects/${projectId}`
    );
  }
}
