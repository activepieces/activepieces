import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { FlagService, environment } from '@activepieces/ui/common';
import {
  ApEdition,
  ApFlagId,
  AppConnectionType,
  SeekPage,
} from '@activepieces/shared';
import { OAuthApp } from '@activepieces/ee-shared';
import {
  PieceOAuth2DetailsMap,
  handleErrorForGettingPiecesOAuth2Details,
} from '../add-edit-connection-button/utils';

@Injectable({
  providedIn: 'root',
})
export class CloudAuthConfigsService {
  constructor(private http: HttpClient, private flagsService: FlagService) {}
  getAppsAndTheirClientIds(): Observable<PieceOAuth2DetailsMap> {
    return this.flagsService.getAllFlags().pipe(
      switchMap((flags) => {
        const edition = flags[ApFlagId.EDITION] as ApEdition;
        const CLOUD_AUTH_ENABLED = flags[ApFlagId.CLOUD_AUTH_ENABLED];
        const platformAuth$: Observable<PieceOAuth2DetailsMap> = this.http
          .get<SeekPage<OAuthApp>>(environment.apiUrl + '/oauth-apps')
          .pipe(
            map((res) => {
              const platformAppsClientIdMap: PieceOAuth2DetailsMap = {};
              res.data.forEach((app) => {
                platformAppsClientIdMap[app.pieceName] = {
                  clientId: app.clientId,
                  connectionType: AppConnectionType.PLATFORM_OAUTH2,
                };
              });
              return platformAppsClientIdMap;
            }),
            handleErrorForGettingPiecesOAuth2Details
          );

        const cloudAuth$ = this.http
          .get<{ [pieceName: string]: { clientId: string } }>(
            'https://secrets.activepieces.com/apps?edition=' + edition
          )
          .pipe(
            map((res) => {
              const cloudManagedOAuth2Apps: PieceOAuth2DetailsMap = {};
              Object.entries(res).forEach(([pieceName, value]) => {
                cloudManagedOAuth2Apps[pieceName] = {
                  clientId: value.clientId,
                  connectionType: AppConnectionType.CLOUD_OAUTH2,
                };
              });
              return cloudManagedOAuth2Apps;
            }),
            handleErrorForGettingPiecesOAuth2Details
          );
        const both$: Observable<PieceOAuth2DetailsMap> = forkJoin({
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
