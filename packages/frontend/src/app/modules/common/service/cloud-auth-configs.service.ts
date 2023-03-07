import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CloudAuthConfigsService {
  constructor(private http: HttpClient) {}
  getAppsAndTheirClientIds(): Observable<{
    [appName: string]: { clientId: string };
  }> {
    return this.http.get<{ [appName: string]: { clientId: string } }>(
      'https://secrets.activepieces.com/apps'
    );
  }
}
