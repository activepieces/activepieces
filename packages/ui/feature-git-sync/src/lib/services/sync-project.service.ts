import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import { ConfigureRepoRequest, GitRepo, ProjectSyncPlan, PullGitRepoRequest } from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';
import { map } from 'rxjs';
import { AuthenticationService } from '@activepieces/ui/common';
import { PushGitRepoRequest } from '@activepieces/ee-shared';
@Injectable({
  providedIn: 'root',
})
export class SyncProjectService {
  prefix = `${environment.apiUrl}/git-repos`;
  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {}

  list() {
    const projectId = this.authenticationService.getProjectId();
    return this.http
      .get<SeekPage<GitRepo>>(environment.apiUrl + '/git-repos', {
        params: {
          projectId,
        },
      })
      .pipe(map((res) => res.data));
  }

  configureRepo(request: ConfigureRepoRequest) {
    return this.http.post<GitRepo>(this.prefix, request, {});
  }
  disconnect(repoId: string) {
    return this.http.delete<void>(`${this.prefix}/${repoId}`);
  }

  push(repoId: string, request: PushGitRepoRequest) {
    return this.http.post<void>(`${this.prefix}/${repoId}/push`, request);
  }
  pull(repoId: string, request: PullGitRepoRequest) {
    return this.http.post<ProjectSyncPlan>(`${this.prefix}/${repoId}/pull`, request);
  }
}
