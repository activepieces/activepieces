import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import { ConfigureRepoRequest, GitRepo } from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SyncProjectService {
  constructor(private http: HttpClient) {}

  list(projectId: string) {
    return this.http
      .get<SeekPage<GitRepo>>(environment.apiUrl + '/git-repos', {
        params: {
          projectId,
        },
      })
      .pipe(map((res) => res.data));
  }

  configureRepo(request: ConfigureRepoRequest) {
    return this.http.post<void>(environment.apiUrl + '/git-repos', request, {});
  }
}
