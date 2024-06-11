import {
  ActivateKeyRequestBody,
  ActivationKeyEntity,
  ActivationKeyStatus,
  CreateKeyRequestBody,
  GetKeyRequestParams,
} from '@activepieces/shared';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { RequestTrialComponent } from '../components/request-trial/request-trial.component';

@Injectable({
  providedIn: 'root',
})
export class ActivationKeysService {
  constructor(private http: HttpClient, private matDialog: MatDialog) {}
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
  openTrialDialog() {
    this.matDialog.open(RequestTrialComponent, {
      panelClass: 'fullscreen-dialog',
    });
  }
  getPlatformKeyStatus() {
    return this.http.get<ActivationKeyStatus>(
      `${environment.apiUrl}/activation-keys/platform-key-status`
    );
  }
}
