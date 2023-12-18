import { Injectable } from '@angular/core';

import { map, Observable, switchMap, take } from 'rxjs';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';

import { Store } from '@ngrx/store';
import { AppConnectionsService } from '../service/app-connections.service';
import { ProjectSelectors } from '../store/project/project.selector';
import { AuthenticationService } from '../service';

export type ConnectionsResolverData = AppConnectionWithoutSensitiveData[];

@Injectable({
  providedIn: 'root',
})
export class ConnectionsResolver {
  constructor(
    private appConnectionsService: AppConnectionsService,
    private authenticationService: AuthenticationService,
    private store: Store
  ) {}
  resolve(): Observable<AppConnectionWithoutSensitiveData[]> {
    return this.store.select(ProjectSelectors.selectCurrentProject).pipe(
      take(1),
      switchMap(() => {
        return this.appConnectionsService.list({
          limit: 999999,
          projectId: this.authenticationService.getProjectId(),
        });
      }),
      map((res) => {
        return res.data;
      })
    );
  }
}
