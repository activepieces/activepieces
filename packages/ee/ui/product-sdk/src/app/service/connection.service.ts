import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConnection } from '@activepieces/shared';
import {
  GetOrDeleteConnectionFromTokenRequest,
  UpsertConnectionFromToken,
} from '@activepieces/ee-shared';
import { getHost } from '../helper/helper';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  constructor(private http: HttpClient) {}

  get(
    request: GetOrDeleteConnectionFromTokenRequest
  ): Observable<AppConnection | null> {
    return this.http.get<AppConnection | null>(
      getHost() + '/v1/connection-keys/app-connections',
      { params: request }
    );
  }

  create(request: UpsertConnectionFromToken) {
    return this.http.post<AppConnection>(
      getHost() + '/v1/connection-keys/app-connections',
      request
    );
  }

  delete(request: GetOrDeleteConnectionFromTokenRequest) {
    return this.http.delete<void>(
      getHost() + `/v1/connection-keys/app-connections`,
      { params: request }
    );
  }
}

export interface OAuth2Response {
  code: string;
  scope: string;
  state: string;
}
