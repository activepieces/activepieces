import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { ProjectId, SeekPage } from '@activepieces/shared';
import { getHost } from '../helper/helper';
import { AppCredential } from '@activepieces/ee-shared';

@Injectable({
  providedIn: 'root',
})
export class CredentialService {
  constructor(private http: HttpClient) {}

  list(projectId: ProjectId): Observable<SeekPage<AppCredential>> {
    return this.http.get<SeekPage<AppCredential>>(
      getHost() + `/v1/app-credentials`,
      { params: { projectId, limit: 999999 } }
    );
  }

  byName(
    projectId: ProjectId,
    name: string
  ): Observable<AppCredential | undefined> {
    return this.list(projectId).pipe(
      shareReplay(1),
      map((page) => {
        return page.data.find((f) => f.appName === name);
      })
    );
  }
}
