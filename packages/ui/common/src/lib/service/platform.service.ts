import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  OAuthApp,
  Platform,
  UpdatePlatformRequestBody,
} from '@activepieces/ee-shared';
import { environment } from '../environments/environment';
import { SeekPage, UpsertAppConnectionRequestBody } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  constructor(private http: HttpClient) {}

  updatePlatform(req: UpdatePlatformRequestBody, platformId: string) {
    return this.http.post<void>(
      `${environment.apiUrl}/platforms/${platformId}`,
      req
    );
  }
  getPlatform(platformId: string) {
    return this.http.get<Platform>(
      `${environment.apiUrl}/platforms/${platformId}`
    );
  }
  uspertOAuth2App(req: UpsertAppConnectionRequestBody) {
    return this.http.post<void>(`${environment.apiUrl}/app-connections`, req);
  }
  listOAuth2Apps() {
    return this.http.get<SeekPage<OAuthApp>>(
      `${environment.apiUrl}/app-connections`
    );
  }
}
