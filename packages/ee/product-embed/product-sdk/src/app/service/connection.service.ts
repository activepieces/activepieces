import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConnection } from '@activepieces/shared';
import {
  GetOrDeleteConnectionFromTokenRequest,
  UpsertConnectionFromToken,
} from '@ee/product-embed/shared/connection-keys/connection-requests';
import { getApiUrl } from '../helper/helper';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  constructor(private http: HttpClient) {}

  get(
    request: GetOrDeleteConnectionFromTokenRequest
  ): Observable<AppConnection | null> {
    return this.http.get<AppConnection | null>(
      getApiUrl() + '/v1/connection-keys/app-connections',
      { params: request }
    );
  }

  create(request: UpsertConnectionFromToken) {
    return this.http.post<AppConnection>(
      getApiUrl() + '/v1/connection-keys/app-connections',
      request
    );
  }

  delete(request: GetOrDeleteConnectionFromTokenRequest) {
    return this.http.delete<void>(
      getApiUrl() + `/v1/connection-keys/app-connections`,
      { params: request }
    );
  }
}

export interface OAuth2Response {
  code: string;
  scope: string;
  state: string;
}
