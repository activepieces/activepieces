import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import {
  AddSigningKeyRequestBody,
  AddSigningKeyResponse,
  SigningKey,
  SigningKeyId,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class SigningKeysService {
  constructor(private http: HttpClient) {}
  list() {
    return this.http.get<SeekPage<SigningKey>>(
      environment.apiUrl + '/signing-keys'
    );
  }
  delete(keyId: SigningKeyId) {
    return this.http.delete<void>(
      environment.apiUrl + `/signing-keys/${keyId}`
    );
  }
  create(request: AddSigningKeyRequestBody) {
    return this.http.post<AddSigningKeyResponse>(
      environment.apiUrl + `/signing-keys/`,
      request
    );
  }
}
