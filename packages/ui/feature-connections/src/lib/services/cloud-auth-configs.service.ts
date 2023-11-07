import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import {
  AuthenticationService,
  FlagService,
  environment,
} from '@activepieces/ui/common';
import { ApEdition, ApFlagId, SeekPage } from '@activepieces/shared';
import { OAuthApp } from '@activepieces/ee-shared';

type AppsClientIdMap = { [appName: string]: { clientId: string } };
@Injectable({
  providedIn: 'root',
})
export class CloudAuthConfigsService {
  constructor(
    private http: HttpClient,
    private flagsService: FlagService,
    private authenticationService: AuthenticationService
  ) {}
  getAppsAndTheirClientIds(): Observable<Record<string, { clientId: string }>> {
    return this.flagsService.getAllFlags().pipe(
      switchMap((flags) => {
        const edition = flags[ApFlagId.EDITION];
        const CLOUD_AUTH_ENABLED = flags[ApFlagId.CLOUD_AUTH_ENABLED];
        if (!CLOUD_AUTH_ENABLED) {
          const empty: Record<string, { clientId: string }> = {};
          return of(empty);
        }
        return this.http
          .get<AppsClientIdMap>(
            'https://secrets.activepieces.com/apps?edition=' + edition
          )
          .pipe(
            switchMap((cloudApps) => {
              const edition = flags[ApFlagId.EDITION];
              if (
                edition === ApEdition.COMMUNITY ||
                !this.authenticationService.getPlatformId()
              ) {
                return of({ ...cloudApps });
              }
              return this.http
                .get<SeekPage<OAuthApp>>(environment.apiUrl + '/oauth-apps')
                .pipe(
              
                  map((res) => {
                    const platformAppsClientIdMap: AppsClientIdMap = {};
                    res.data.forEach((app) => {
                      platformAppsClientIdMap[app.pieceName] = {
                        clientId: app.clientId,
                      };
                    });
                    return {
                      ...cloudApps,
                      ...platformAppsClientIdMap,
                    };
                  }),
                  catchError((err)=>{
                    console.warn(err);
                    return of({...cloudApps});
                  })
                );
            })
          );
      })
    );
  }
}
