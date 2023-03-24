import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { FlagService } from './flag.service';

@Injectable({
  providedIn: 'root',
})
export class CloudAuthConfigsService {
  constructor(private http: HttpClient, private flagsService: FlagService) {}
  getAppsAndTheirClientIds(): Observable<{
    [appName: string]: { clientId: string };
  }> {
    return this.flagsService.getEdition().pipe(
      switchMap((edition) => {
        return this.http.get<{ [appName: string]: { clientId: string } }>(
          'https://secrets.activepieces.com/apps?edition=' + edition
        );
      })
    );
  }
}
