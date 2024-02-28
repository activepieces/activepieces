import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { GitRepo } from '@activepieces/ee-shared';
import {
  AuthenticationService,
  FlagService,
  PlatformService,
} from '@activepieces/ui/common';
import { ApEdition } from '@activepieces/shared';
import { SyncProjectService } from '@activepieces/ui-feature-git-sync';

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
    return isGitSyncLocked(
      this.flagService,
      this.platformService,
      this.authenticationService.getPlatformId()
    ).pipe(
      switchMap((gitSyncLocked) => {
        if (!gitSyncLocked) {
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
      }),
      catchError((err) => {
        console.error(err);
        return of({ showUpgrade: true });
      })
    );
  }
}

export const isGitSyncLocked = (
  flagService: FlagService,
  platformService: PlatformService,
  platformId?: string
) => {
  return flagService.getEdition().pipe(
    switchMap((ed) => {
      if (ed === ApEdition.COMMUNITY) {
        return of(true);
      }

      return platformService.getPlatform(platformId!).pipe(
        map((p) => {
          return !p.gitSyncEnabled;
        })
      );
    })
  );
};
