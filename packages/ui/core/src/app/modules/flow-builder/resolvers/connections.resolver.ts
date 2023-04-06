import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { AppConnection } from '@activepieces/shared';

import { ProjectService, AppConnectionsService } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class ConnectionsResolver implements Resolve<AppConnection[]> {
  constructor(
    private appConnectionsService: AppConnectionsService,
    private projectService: ProjectService
  ) {}
  resolve(): Observable<AppConnection[]> {
    return this.projectService.getSelectedProject().pipe(
      switchMap(() => {
        return this.appConnectionsService.list({ limit: 999999 });
      }),
      map((res) => {
        return res.data;
      })
    );
  }
}
