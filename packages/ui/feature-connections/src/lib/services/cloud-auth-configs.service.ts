import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { FlagService, environment } from '@activepieces/ui/common';
import { ApEdition, ApFlagId, SeekPage } from '@activepieces/shared';
import { OAuthApp } from '@activepieces/ee-shared';
import { returnEmptyRecordInCaseErrorOccurs } from '../add-edit-connection-button/utils';

type AppsClientIdMap = { [appName: string]: { clientId: string } };
@Injectable({
  providedIn: 'root',
})
export class CloudAuthConfigsService {
  constructor(private http: HttpClient, private flagsService: FlagService) {}
  getAppsAndTheirClientIds(): Observable<AppsClientIdMap> {
    return this.flagsService.getAllFlags().pipe(
      switchMap((flags) => {
        const edition = flags[ApFlagId.EDITION] as ApEdition;
        const CLOUD_AUTH_ENABLED = flags[ApFlagId.CLOUD_AUTH_ENABLED];
        const platformAuth$: Observable<AppsClientIdMap> = this.http
          .get<SeekPage<OAuthApp>>(environment.apiUrl + '/oauth-apps')
          .pipe(
            map((res) => {
              const platformAppsClientIdMap: AppsClientIdMap = {};
              res.data.forEach((app) => {
                platformAppsClientIdMap[app.pieceName] = {
                  clientId: app.clientId,
                };
              });
              return platformAppsClientIdMap;
            }),
            returnEmptyRecordInCaseErrorOccurs
          );

        const cloudAuth$ = this.http.get<AppsClientIdMap>(
          'https://secrets.activepieces.com/apps?edition=' + edition
        );
        const both$: Observable<AppsClientIdMap> = forkJoin({
          cloudAuth: cloudAuth$,
          platformAuth: platformAuth$,
        }).pipe(
          map((res) => {
            return {
              ...res.cloudAuth,
              ...res.platformAuth,
            };
          })
        );

        switch (edition) {
          case ApEdition.COMMUNITY: {
            if (CLOUD_AUTH_ENABLED) return cloudAuth$;
            return of({});
          }
          case ApEdition.CLOUD: {
            return both$;
          }
          case ApEdition.ENTERPRISE: {
            if (CLOUD_AUTH_ENABLED) return both$;
            return platformAuth$;
          }
        }
      })
    );
  }
}
