import { Component, Inject, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { catchError, Observable, of, take, tap } from 'rxjs';
import {
  AppConnection,
  UpsertCloudOAuth2Request,
  Project,
  CloudOAuth2ConnectionValue,
  CloudAuth2Connection,
} from '@activepieces/shared';
import { fadeInUp400ms } from 'packages/frontend/src/app/modules/common/animation/fade-in-up.animation';
import { PieceConfig } from 'packages/frontend/src/app/modules/common/components/configs-form/connector-action-or-config';
import { CloudConnectionPopupSettings } from 'packages/frontend/src/app/modules/common/components/form-controls/o-auth2-cloud-connect-control/o-auth2-cloud-connect-control.component';
import { AppConnectionsService } from 'packages/frontend/src/app/modules/common/service/app-connections.service';
import { ProjectService } from 'packages/frontend/src/app/modules/common/service/project.service';
import { ConnectionValidator } from 'packages/frontend/src/app/modules/flow-builder/page/flow-builder/validators/connectionNameValidator';
import { appConnectionsActions } from 'packages/frontend/src/app/modules/flow-builder/store/app-connections/app-connections.action';
import { BuilderSelectors } from 'packages/frontend/src/app/modules/flow-builder/store/builder/builder.selector';

interface AuthConfigSettings {
  appName: FormControl<string | null>;
  name: FormControl<string>;
  value: FormControl<CloudOAuth2ConnectionValue>;
}
export const USE_MY_OWN_CREDENTIALS = 'USE_MY_OWN_CREDENTIALS';
@Component({
  selector: 'app-cloud-authentication-modal',
  templateUrl: './cloud-oauth2-connection-dialog.component.html',
  styleUrls: ['./cloud-oauth2-connection-dialog.component.scss'],
  animations: [fadeInUp400ms],
})
export class CloudOAuth2ConnectionDialogComponent implements OnInit {
  @Input() pieceAuthConfig: PieceConfig;
  @Input() pieceName: string;
  @Input() connectionToUpdate: CloudAuth2Connection | undefined;
  cloudConnectionPopupSettings: CloudConnectionPopupSettings;
  settingsForm: FormGroup<AuthConfigSettings>;
  project$: Observable<Project>;
  loading = false;
  upsert$: Observable<AppConnection | null>;
  keyTooltip =
    'The ID of this connection definition. You will need to select this key whenever you want to reuse this connection.';
  constructor(
    private fb: FormBuilder,
    private store: Store,
    public dialogRef: MatDialogRef<CloudOAuth2ConnectionDialogComponent>,
    private appConnectionsService: AppConnectionsService,
    private snackbar: MatSnackBar,
    private projectService: ProjectService,
    @Inject(MAT_DIALOG_DATA)
    dialogData: {
      pieceAuthConfig: PieceConfig;
      pieceName: string;
      connectionToUpdate: CloudAuth2Connection | undefined;
      clientId: string;
    }
  ) {
    this.pieceName = dialogData.pieceName;
    this.pieceAuthConfig = dialogData.pieceAuthConfig;
    this.connectionToUpdate = dialogData.connectionToUpdate;
    this.cloudConnectionPopupSettings = {
      authUrl: this.pieceAuthConfig.authUrl!,
      scope: this.pieceAuthConfig.scope!.join(' '),
      extraParams: this.pieceAuthConfig.extra!,
      pieceName: this.pieceName,
      clientId: dialogData.clientId,
    };
  }

  ngOnInit(): void {
    this.project$ = this.projectService.selectedProjectAndTakeOne();
    this.settingsForm = this.fb.group({
      appName: new FormControl<string | null>(this.pieceName, {
        nonNullable: false,
        validators: [],
      }),
      name: new FormControl(this.pieceName.replace(/[^A-Za-z0-9_]/g, '_'), {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern('[A-Za-z0-9_]*')],
        asyncValidators: [
          ConnectionValidator.createValidator(
            this.store
              .select(BuilderSelectors.selectAllAppConnections)
              .pipe(take(1)),
            undefined
          ),
        ],
      }),
      value: new FormControl(undefined as any, Validators.required),
    });
    if (this.connectionToUpdate) {
      this.settingsForm.controls.value.setValue(this.connectionToUpdate.value);
      this.settingsForm.controls.name.setValue(this.connectionToUpdate.name);
      this.settingsForm.controls.name.disable();
    }
    this.settingsForm.controls.name.markAllAsTouched();
  }
  submit(projectId: string) {
    this.settingsForm.markAllAsTouched();
    if (this.settingsForm.valid && !this.loading) {
      this.loading = true;
      const config = this.constructConnection(projectId);
      this.saveConnection(config);
    }
  }
  constructConnection(projectId: string) {
    const connectionName = this.connectionToUpdate
      ? this.connectionToUpdate.name
      : this.settingsForm.controls.name.value;
    const settingsFormValue = { ...this.settingsForm.getRawValue() };
    const connectionValue = settingsFormValue.value;

    const newConnection: UpsertCloudOAuth2Request = {
      appName: this.pieceName,
      value: { ...connectionValue },
      name: connectionName,
      projectId: projectId,
    };
    return newConnection;
  }

  saveConnection(connection: UpsertCloudOAuth2Request): void {
    this.upsert$ = this.appConnectionsService.upsert(connection).pipe(
      catchError((err) => {
        console.error(err);
        this.snackbar.open(
          'Connection operation failed please check your console.',
          'Close',
          {
            panelClass: 'error',
            duration: 5000,
          }
        );
        return of(null);
      }),
      tap((connection) => {
        if (connection) {
          this.store.dispatch(
            appConnectionsActions.upsert({ connection: connection })
          );
          this.dialogRef.close(connection);
        }
        this.loading = false;
      })
    );
  }
  get authenticationSettingsControlsValid() {
    return Object.keys(this.settingsForm.controls)
      .filter(
        (k) => k !== 'connection' && !this.settingsForm.controls[k].disabled
      )
      .map((key) => {
        return this.settingsForm.controls[key].valid;
      })
      .reduce((prev, next) => {
        return prev && next;
      }, true);
  }
  useOwnCred() {
    this.dialogRef.close(USE_MY_OWN_CREDENTIALS);
  }
}
