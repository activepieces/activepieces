import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { FlagService } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class CloudAuthConfigsService {
  constructor(private http: HttpClient, private flagsService: FlagService) {}
  getAppsAndTheirClientIds(): Observable<Record<string, { clientId: string }>> {
    return forkJoin({
      edition: this.flagsService.getEdition(),
      cloudAuthEnabled: this.flagsService.isCloudAuthEnabled()
    }).pipe(
      switchMap((flags) => {
        if (!flags.cloudAuthEnabled) {
          const empty: Record<string, { clientId: string }> = {};
          return of(empty);
        }
        return this.http.get<{ [appName: string]: { clientId: string } }>(
          'https://secrets.activepieces.com/apps?edition=' + flags.edition
        );
      })
    );
  }
}
