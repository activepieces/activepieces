import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { map, Observable, switchMap, take } from 'rxjs';
import { AppConnection } from '@activepieces/shared';

import {
  AppConnectionsService,
  ProjectSelectors,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root',
})
export class ConnectionsResolver implements Resolve<AppConnection[]> {
  constructor(
    private appConnectionsService: AppConnectionsService,
    private store: Store
  ) {}
  resolve(): Observable<AppConnection[]> {
    return this.store.select(ProjectSelectors.selectProject).pipe(
      take(1),
      switchMap(() => {
        return this.appConnectionsService.list({ limit: 999999 });
      }),
      map((res) => {
        return res.data;
      })
    );
  }
}
