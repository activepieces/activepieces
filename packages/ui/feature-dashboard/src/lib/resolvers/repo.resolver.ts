import { Injectable } from '@angular/core';
import { SyncProjectService } from '../services/sync-project.service';
import { map, Observable, of, switchMap } from 'rxjs';
import { GitRepo } from '@activepieces/ee-shared';
import {
  AuthenticationService,
  FlagService,
  PlatformService,
} from '@activepieces/ui/common';
import { ApEdition } from '@activepieces/shared';

export type RepoResolverData = {
  repo?: GitRepo;
  showUpgrade: boolean;
};
@Injectable({
  providedIn: 'root',
})
export class RepoResolver {
  constructor(
    private syncProjectService: SyncProjectService,
    private flagService: FlagService,
    private platformService: PlatformService,
    private authenticationService: AuthenticationService
  ) {}

  resolve(): Observable<RepoResolverData> {
    return this.flagService.getEdition().pipe(
      switchMap((ed) => {
        if (ed === ApEdition.COMMUNITY) {
          return of({
            showUpgrade: true,
          });
        }
        const platformId = this.authenticationService.getPlatformId()!;
        return this.platformService.getPlatform(platformId).pipe(
          switchMap((p) => {
            if (p.gitSyncEnabled) {
              return this.syncProjectService.list().pipe(
                map((res) => {
                  return {
                    showUpgrade: false,
                    repo: res[0],
                  };
                })
              );
            }
            return of({
              showUpgrade: true,
            });
          })
        );
      })
    );
  }
}
