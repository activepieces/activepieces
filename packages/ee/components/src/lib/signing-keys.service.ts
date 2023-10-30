import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import {
  SigningKey,
  SigningKeyId,
  CreateSigningKeyRequest,
} from '@activepieces/ee-shared';

@Injectable({
  providedIn: 'root',
})
export class SigningKeysService {
  constructor(private http: HttpClient) {}
  list() {
    return this.http.get<SigningKey[]>(environment.apiUrl + '/signing-keys');
  }
  delete(keyId: SigningKeyId) {
    return this.http.get<void>(environment.apiUrl + `/signing-keys/${keyId}`);
  }
  create(request: CreateSigningKeyRequest) {
    return this.http.post(environment.apiUrl + `/signing-keys/`, request);
  }
}
