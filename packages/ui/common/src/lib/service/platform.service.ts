import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  OAuthApp,
  Platform,
  UpdatePlatformRequestBody,
  UpsertOAuth2AppRequest,
} from '@activepieces/ee-shared';
import { environment } from '../environments/environment';
import { SeekPage } from '@activepieces/shared';

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
  uspertOAuth2AppCredentials(req: UpsertOAuth2AppRequest) {
    return this.http.post<void>(`${environment.apiUrl}/oauth-apps`, req);
  }
  listOAuth2AppsCredentials() {
    return this.http.get<SeekPage<OAuthApp>>(
      `${environment.apiUrl}/oauth-apps`
    );
  }
  deleteOAuth2AppCredentials(credentialId: string) {
    return this.http.delete<void>(
      `${environment.apiUrl}/oauth-apps/${credentialId}`
    );
  }
}
