import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { ProjectId, SeekPage } from '@activepieces/shared';
import {
  CreatePlatformProjectRequest,
  ProjectWithUsageAndPlanResponse,
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
    return this.http.post<ProjectWithUsageAndPlanResponse>(
      environment.apiUrl + '/projects/',
      req
    );
  }
  update(
    projectId: ProjectId,
    request: UpdateProjectPlatformRequest
  ): Observable<ProjectWithUsageAndPlanResponse> {
    return this.http.post<ProjectWithUsageAndPlanResponse>(
      environment.apiUrl + '/projects/' + projectId,
      request
    );
  }

  list(platformId?: string): Observable<ProjectWithUsageAndPlanResponse[]> {
    const params: Record<string, string> = platformId ? { platformId } : {};
    return this.http
      .get<SeekPage<ProjectWithUsageAndPlanResponse>>(
        environment.apiUrl + `/users/projects`,
        {
          params,
        }
      )
      .pipe(map((res) => res.data));
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
}
