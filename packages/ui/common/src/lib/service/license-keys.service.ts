import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  RequestTrialComponent,
  RequestTrialDialogData,
} from '../components/request-trial/request-trial.component';
import {
  LicenseKeyStatus,
  CreateTrialLicenseKeyRequestBody,
} from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class LicenseKeysService {
  constructor(private http: HttpClient, private matDialog: MatDialog) {}
  createKey(req: CreateTrialLicenseKeyRequestBody): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/license-keys`, req);
  }
  openTrialDialog() {
    const data: RequestTrialDialogData = { isDialog: true };
    this.matDialog.open(RequestTrialComponent, {
      panelClass: 'fullscreen-dialog',
      data,
    });
  }
  getPlatformKeyStatus() {
    return this.http.get<LicenseKeyStatus>(
      `${environment.apiUrl}/license-keys/status`
    );
  }
}
