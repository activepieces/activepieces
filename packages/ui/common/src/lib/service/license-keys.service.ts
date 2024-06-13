import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

import {
  LicenseKeyStatus,
  CreateTrialLicenseKeyRequestBody,
} from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class LicenseKeysService {
  constructor(private http: HttpClient) {}
  createKey(req: CreateTrialLicenseKeyRequestBody): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/license-keys`, req);
  }

  getPlatformKeyStatus() {
    return this.http.get<LicenseKeyStatus>(
      `${environment.apiUrl}/license-keys/status`
    );
  }
}
