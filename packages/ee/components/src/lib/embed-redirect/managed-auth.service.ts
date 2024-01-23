import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import { ManagedAuthnRequestBody } from '@activepieces/ee-shared';
import { HttpClient } from '@angular/common/http';
import { AuthenticationResponse } from '@activepieces/shared';

export type EmbeddingState = {
  isEmbedded: boolean;
  hideSideNav: boolean;
  prefix: string;
};
@Injectable({
  providedIn: 'root',
})
export class ManagedAuthService {
  constructor(private http: HttpClient) {}
  generateApToken(request: ManagedAuthnRequestBody) {
    return this.http.post<AuthenticationResponse>(
      environment.apiUrl + `/managed-authn/external-token`,
      request
    );
  }
}
