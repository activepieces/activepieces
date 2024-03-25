import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
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
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PlatformProjectService {
  constructor(private http: HttpClient, private router: Router) {}

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
    return this.http.post<ProjectWithLimits>(
      environment.apiUrl + '/projects/' + projectId,
      request
    );
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

  switchProject(projectId: string, redirectHome?: boolean): Observable<void> {
    return this.http
      .post<{
        token: string;
      }>(`${environment.apiUrl}/users/projects/${projectId}/token`, {
        projectId,
      })
      .pipe(
        tap(({ token }) => {
          localStorage.setItem(environment.jwtTokenName, token);
          if (redirectHome) {
            this.router.navigate(['/flows']);
          }
          setTimeout(() => {
            window.location.reload();
          }, 10);
        }),
        map(() => void 0)
      );
  }

  delete(projectId: ProjectId): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/projects/${projectId}`
    );
  }
}
