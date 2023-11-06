import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, map, tap } from 'rxjs';
import { Project, ProjectId } from '@activepieces/shared';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
} from '@activepieces/ee-shared';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private http: HttpClient, private router: Router) {}

  create(req: CreateProjectRequest) {
    return this.http.post<void>(environment.apiUrl + '/projects/', req);
  }
  update(
    projectId: ProjectId,
    request: UpdateProjectRequest
  ): Observable<Project> {
    return this.http.post<Project>(
      environment.apiUrl + '/projects/' + projectId,
      request
    );
  }

  list(platformId?: string): Observable<Project[]> {
    const params: Record<string, string> = platformId ? { platformId } : {};
    return this.http.get<Project[]>(environment.apiUrl + `/projects`, {
      params,
    });
  }
  switchProject(projectId: string, redirectHome?: boolean): Observable<void> {
    return this.http
      .post<{
        token: string;
      }>(`${environment.apiUrl}/projects/${projectId}/token`, {
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
