import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

import {
  CreateTrialLicenseKeyRequestBody,
  LicenseKeyEntity,
} from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class LicenseKeysService {
  constructor(private http: HttpClient) {}
  createKey(req: CreateTrialLicenseKeyRequestBody): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/license-keys`, req);
  }

  getKey() {
    return this.http.get<LicenseKeyEntity>(
      `${environment.apiUrl}/license-keys/status`
    );
  }
}
