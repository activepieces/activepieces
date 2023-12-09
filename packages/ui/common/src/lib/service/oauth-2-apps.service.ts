import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  OAuthApp,
  UpsertOAuth2AppRequest,
  ListOAuth2AppRequest,
} from '@activepieces/ee-shared';
import { environment } from '../environments/environment';
import { SeekPage } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class OAuth2AppsService {
  constructor(private http: HttpClient) {}

  uspertOAuth2AppCredentials(req: UpsertOAuth2AppRequest) {
    return this.http.post<void>(`${environment.apiUrl}/oauth-apps`, req);
  }
  listOAuth2AppsCredentials() {
    const listOAuth2AppRequest: ListOAuth2AppRequest = {
      limit: 1000000,
    };
    return this.http.get<SeekPage<OAuthApp>>(
      `${environment.apiUrl}/oauth-apps`,
      {
        params: listOAuth2AppRequest,
      }
    );
  }
  deleteOAuth2AppCredentials(credentialId: string) {
    return this.http.delete<void>(
      `${environment.apiUrl}/oauth-apps/${credentialId}`
    );
  }
}
