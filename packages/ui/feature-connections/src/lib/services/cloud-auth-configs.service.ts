import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { FlagService, OAuth2AppsService } from '@activepieces/ui/common';
import { ApEdition, ApFlagId, AppConnectionType } from '@activepieces/shared';
import {
  PieceOAuth2DetailsMap,
  handleErrorForGettingPiecesOAuth2Details,
} from '../components/add-edit-connection-button/utils';

@Injectable({
  providedIn: 'root',
})
export class CloudAuthConfigsService {
  constructor(
    private http: HttpClient,
    private flagsService: FlagService,
    private oAuth2AppsService: OAuth2AppsService
  ) {}

  private getPlatformAuth(
    edition: ApEdition
  ): Observable<PieceOAuth2DetailsMap> {
    if (edition === ApEdition.COMMUNITY) {
      return of({});
    }
    return this.oAuth2AppsService.listOAuth2AppsCredentials().pipe(
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
  }

  private getCloudAuth(
    cloudAuthEnabled: boolean,
    edition: ApEdition
  ): Observable<PieceOAuth2DetailsMap> {
    if (!cloudAuthEnabled) {
      return of({});
    }
    return this.http
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
  }

  getAppsAndTheirClientIds(): Observable<PieceOAuth2DetailsMap> {
    return forkJoin({
      edition: this.flagsService.getEdition(),
      cloudAuthEnabled: this.flagsService.isFlagEnabled(
        ApFlagId.CLOUD_AUTH_ENABLED
      ),
    }).pipe(
      switchMap((flags) => {
        const platformAuth$ = this.getPlatformAuth(flags.edition);
        const cloudAuth$ = this.getCloudAuth(
          flags.cloudAuthEnabled,
          flags.edition
        );
        return forkJoin({
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
      })
    );
  }
}
