import {
  ActivateKeyRequestBody,
  ActivationKeyEntity,
  CreateKeyRequestBody,
  GetKeyRequestParams,
} from '@activepieces/shared';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FlagService } from './flag.service';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { RequestTrialComponent } from '../components/request-trial/request-trial.component';

@Injectable({
  providedIn: 'root',
})
export class ActivationKeysService {
  constructor(
    private http: HttpClient,
    private matDialog: MatDialog,
    private snackbar: MatSnackBar,
    private flagsService: FlagService
  ) {}
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
    return this.flagsService.getDbType().pipe(
      map((dbType) => {
        return dbType === 'POSTGRES';
      }),
      tap((isPostgres) => {
        if (isPostgres) {
          this.matDialog.open(RequestTrialComponent, {
            panelClass: 'fullscreen-dialog',
          });
        } else {
          this.snackbar.open(
            $localize`Please switch your DBMS to Postgres to request a trial.`
          );
        }
      })
    );
  }
}
