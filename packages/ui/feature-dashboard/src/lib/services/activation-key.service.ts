import {
  ActivateKeyRequestBody,
  ActivationKeyEntity,
  CreateKeyRequestBody,
  GetKeyRequestParams,
} from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ActivationKeysService {
  constructor(private http: HttpClient) {}
  getKey(req: GetKeyRequestParams): Observable<ActivationKeyEntity> {
    return this.http.get<ActivationKeyEntity>(
      `${environment.apiUrl}/activation-keys/${req.key}`
    );
  }
  createKey(req: CreateKeyRequestBody): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/activation-keys`, req);
  }
  activateKey(req: ActivateKeyRequestBody): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/activation-keys/activate`,
      req
    );
  }
}
