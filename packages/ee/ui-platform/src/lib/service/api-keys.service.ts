import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import {
  ApiKeyResponseWithValue,
  ApiKeyResponseWithoutValue,
  CreateApiKeyRequest,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class ApiKeysService {
  constructor(private http: HttpClient) {}
  list() {
    return this.http.get<SeekPage<ApiKeyResponseWithoutValue>>(
      environment.apiUrl + '/api-keys'
    );
  }
  delete(keyId: string) {
    return this.http.delete<void>(environment.apiUrl + `/api-keys/${keyId}`);
  }
  create(request: CreateApiKeyRequest) {
    return this.http.post<ApiKeyResponseWithValue>(
      environment.apiUrl + `/api-keys/`,
      request
    );
  }
}
