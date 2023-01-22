import {
  AppConnection,
  AppConnectionType,
  Project,
} from '@activepieces/shared';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { AppConnectionsService } from 'packages/frontend/src/app/modules/common/service/app-connections.service';
import { ProjectService } from 'packages/frontend/src/app/modules/common/service/project.service';
import { appConnectionsActions } from 'packages/frontend/src/app/modules/flow-builder/store/app-connections/app-connections.action';
import { BuilderSelectors } from 'packages/frontend/src/app/modules/flow-builder/store/builder/builder.selector';
import { catchError, Observable, of, take, tap } from 'rxjs';
import { ConnectionValidator } from '../../../../../../validators/connectionNameValidator';

interface SecretKeyForm {
  secretKey: FormControl<string>;
  name: FormControl<string>;
}
export interface SecretKeyConnectionDialogData {
  pieceName: string;
  connectionName?: string;
  displayName: string;
  description: string;
  secretKey?: string;
}

@Component({
  selector: 'app-secret-key-connection-dialog',
  templateUrl: './secret-key-connection-dialog.component.html',
  styleUrls: ['./secret-key-connection-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretKeyConnectionDialogComponent {
  project$: Observable<Project>;
  settingsForm: FormGroup<SecretKeyForm>;
  keyTooltip =
    'The ID of this connection definition. You will need to select this key whenever you want to reuse this connection.';
  loading = false;
  upsert$: Observable<AppConnection | null>;
  constructor(
    private projectService: ProjectService,
    @Inject(MAT_DIALOG_DATA)
    public dialogData: SecretKeyConnectionDialogData,
    private fb: FormBuilder,
    private store: Store,
    private appConnectionsService: AppConnectionsService,
    private snackbar: MatSnackBar,
    public dialogRef: MatDialogRef<SecretKeyConnectionDialogComponent>
  ) {
    this.project$ = this.projectService.selectedProjectAndTakeOne();
    this.settingsForm = this.fb.group({
      secretKey: new FormControl(this.dialogData.secretKey || '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      name: new FormControl(
        this.dialogData.pieceName.replace(/[^A-Za-z0-9_]/g, '_'),
        {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.pattern('[A-Za-z0-9_]*'),
          ],
          asyncValidators: [
            ConnectionValidator.createValidator(
              this.store
                .select(BuilderSelectors.selectAllAppConnections)
                .pipe(take(1)),
              undefined
            ),
          ],
        }
      ),
    });
    if(this.dialogData.connectionName)
    {
      this.settingsForm.controls.name.disable();

    }
  }
  submit(projectId: string) {
    this.settingsForm.markAllAsTouched();
    if (!this.loading && this.settingsForm.valid) {
      this.loading = true;
      this.upsert$ = this.appConnectionsService
        .upsert({
          projectId: projectId,
          appName: this.dialogData.pieceName,
          name: this.settingsForm.controls.name.value,
          value: {
            secret_key: this.settingsForm.controls.secretKey.value,
            type: AppConnectionType.SECRET_TEXT,
          },
        })
        .pipe(
          catchError((err) => {
            console.error(err);
            this.snackbar.open(
              'Connection operation failed please check your console.',
              'Close',
              { panelClass: 'error', duration: 5000 }
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
  }
}
