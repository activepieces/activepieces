import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { FlagService } from '@activepieces/ui/common';
import { ApFlagId } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class CloudAuthConfigsService {
  constructor(private http: HttpClient, private flagsService: FlagService) {}
  getAppsAndTheirClientIds(): Observable<Record<string, { clientId: string }>> {
    return this.flagsService.getAllFlags().pipe(
      switchMap((flags) => {
        const edition = flags[ApFlagId.EDITION];
        const CLOUD_AUTH_ENABLED = flags[ApFlagId.CLOUD_AUTH_ENABLED];
        if (!CLOUD_AUTH_ENABLED) {
          const empty: Record<string, { clientId: string }> = {};
          return of(empty);
        }
        return this.http.get<{ [appName: string]: { clientId: string } }>(
          'https://secrets.activepieces.com/apps?edition=' + edition
        );
      })
    );
  }
}
