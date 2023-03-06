import {
  AppConnection,
  AppConnectionType,
  BasicAuthConnection,
  OAuth2AppConnection,
  PropertyType,
  SecretKeyAppConnection,
} from '@activepieces/shared';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  BasicAuthConnectionDialogComponent,
  BasicAuthDialogData,
} from '../../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/basic-auth-connection-dialog/basic-auth-connection-dialog.component';
import {
  CloudOAuth2ConnectionDialogComponent,
  USE_MY_OWN_CREDENTIALS,
} from '../../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/cloud-oauth2-connection-dialog/cloud-oauth2-connection-dialog.component';
import {
  OAuth2ConnectionDialogComponent,
  USE_CLOUD_CREDENTIALS,
} from '../../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/oauth2-connection-dialog/oauth2-connection-dialog.component';
import {
  SecretTextConnectionDialogComponent,
  SecretTextConnectionDialogData,
} from '../../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/secret-text-connection-dialog/secret-text-connection-dialog.component';
import { BuilderSelectors } from '../../../../flow-builder/store/builder/builder.selector';
import { CloudAuthConfigsService } from '../../../service/cloud-auth-configs.service';
import { FlagService } from '../../../service/flag.service';
import { PieceConfig } from '../connector-action-or-config';

@Component({
  selector: 'app-add-edit-connection-button',
  templateUrl: './add-edit-connection-button.component.html',
  styleUrls: ['./add-edit-connection-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditConnectionButtonComponent {
  @Input()
  btnSize: 'extraSmall' | 'small' | 'medium' | 'large' | 'default';
  checkingOAuth2CloudManager$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  @Input()
  config: PieceConfig;
  @Input()
  selectedConnectionInterpolatedString: string;
  @Input()
  pieceName: string;
  @Input()
  isEditConnectionButton = false;
  @Output()
  connectionPropertyValueChanged: EventEmitter<{
    configKey: string;
    value: `\${connections.${string}}`;
  }> = new EventEmitter();
  updateOrAddConnectionDialogClosed$: Observable<void>;
  cloudAuthCheck$: Observable<void>;
  constructor(
    private store: Store,
    private dialogService: MatDialog,
    private cloudAuthConfigsService: CloudAuthConfigsService,
    private flagService: FlagService
  ) {}

  buttonClicked() {
    if (this.isEditConnectionButton) {
      this.editConnection();
    } else {
      this.newConnectionDialogProcess();
    }
  }

  private newConnectionDialogProcess() {
    if (this.config.type === PropertyType.OAUTH2) {
      this.newOAuth2AuthenticationDialogProcess();
    } else if (this.config.type === PropertyType.SECRET_TEXT) {
      this.openNewSecretKeyConnection();
    } else {
      this.openNewBasicAuthConnection();
    }
  }

  private openNewBasicAuthConnection() {
    const dialogData: BasicAuthDialogData = {
      pieceAuthConfig: this.config,
      pieceName: this.pieceName,
    };
    this.updateOrAddConnectionDialogClosed$ = this.dialogService
      .open(BasicAuthConnectionDialogComponent, {
        data: dialogData,
      })
      .afterClosed()
      .pipe(
        tap((result: AppConnection | null) => {
          if (result) {
            const authConfigOptionValue: `\${connections.${string}}` = `\${connections.${result.name}}`;
            this.connectionPropertyValueChanged.emit({
              configKey: this.config.key,
              value: authConfigOptionValue,
            });
          }
        }),
        map(() => void 0)
      );
  }
  private openNewSecretKeyConnection() {
    const dialogData: SecretTextConnectionDialogData = {
      pieceName: this.pieceName,
      displayName: this.config.label,
      description: this.config.description || '',
    };
    this.updateOrAddConnectionDialogClosed$ = this.dialogService
      .open(SecretTextConnectionDialogComponent, {
        data: dialogData,
      })
      .afterClosed()
      .pipe(
        tap((result: AppConnection | null) => {
          if (result) {
            const authConfigOptionValue: `\${connections.${string}}` = `\${connections.${result.name}}`;
            this.connectionPropertyValueChanged.emit({
              configKey: this.config.key,
              value: authConfigOptionValue,
            });
          }
        }),
        map(() => void 0)
      );
  }

  private newOAuth2AuthenticationDialogProcess() {
    if (!this.checkingOAuth2CloudManager$.value) {
      this.checkingOAuth2CloudManager$.next(true);
      this.cloudAuthCheck$ = this.cloudAuthConfigsService
        .getAppsAndTheirClientIds()
        .pipe(
          catchError((err) => {
            console.error(err);
            return of({});
          }),
          tap(() => {
            this.checkingOAuth2CloudManager$.next(false);
          }),
          map((res) => {
            return res[this.pieceName];
          }),
          tap((cloudAuth2Config: { clientId: string }) => {
            if (cloudAuth2Config) {
              this.openNewCloudOAuth2ConnectionModal(cloudAuth2Config.clientId);
            } else {
              this.openNewOAuth2ConnectionDialog();
            }
          }),
          map(() => void 0)
        );
    }
  }
  private openNewOAuth2ConnectionDialog() {
    this.updateOrAddConnectionDialogClosed$ = this.flagService
      .getFrontendUrl()
      .pipe(
        switchMap((serverUrl) => {
          return this.dialogService
            .open(OAuth2ConnectionDialogComponent, {
              data: {
                pieceAuthConfig: this.config,
                pieceName: this.pieceName,
                serverUrl: serverUrl,
              },
            })
            .afterClosed()
            .pipe(
              tap((result: OAuth2AppConnection | string) => {
                if (
                  typeof result === 'string' &&
                  result === USE_CLOUD_CREDENTIALS
                ) {
                  this.checkingOAuth2CloudManager$.next(true);
                  this.cloudAuthCheck$ = this.cloudAuthConfigsService
                    .getAppsAndTheirClientIds()
                    .pipe(
                      catchError((err) => {
                        console.error(err);
                        return of({});
                      }),
                      tap(() => {
                        this.checkingOAuth2CloudManager$.next(false);
                      }),
                      map((res) => {
                        return res[this.pieceName];
                      }),
                      tap((cloudAuth2Config: { clientId: string }) => {
                        this.openNewCloudOAuth2ConnectionModal(
                          cloudAuth2Config.clientId
                        );
                      }),
                      map(() => void 0)
                    );
                } else if (typeof result === 'object') {
                  const authConfigOptionValue: `\${connections.${string}}` = `\${connections.${result.name}}`;
                  this.connectionPropertyValueChanged.emit({
                    configKey: this.config.key,
                    value: authConfigOptionValue,
                  });
                }
              }),
              map(() => void 0)
            );
        })
      );
  }

  private openNewCloudOAuth2ConnectionModal(clientId: string) {
    this.updateOrAddConnectionDialogClosed$ = this.dialogService
      .open(CloudOAuth2ConnectionDialogComponent, {
        data: {
          pieceAuthConfig: this.config,
          pieceName: this.pieceName,
          clientId: clientId,
        },
      })
      .afterClosed()
      .pipe(
        tap((result: AppConnection | string) => {
          if (typeof result === 'object') {
            const authConfigOptionValue: `\${connections.${string}}` = `\${connections.${result.name}}`;
            this.connectionPropertyValueChanged.emit({
              configKey: this.config.key,
              value: authConfigOptionValue,
            });
          } else if (result === USE_MY_OWN_CREDENTIALS) {
            this.openNewOAuth2ConnectionDialog();
          }
        }),
        map(() => void 0)
      );
  }

  private editConnection() {
    const allConnections$ = this.store.select(
      BuilderSelectors.selectAllAppConnections
    );
    const currentConnection$ = allConnections$.pipe(
      take(1),
      map((connections) => {
        const connection = connections.find(
          (c) =>
            c.name ===
            this.getConnectionNameFromInterpolatedString(
              this.selectedConnectionInterpolatedString
            )
        );
        return connection!;
      })
    );
    if (this.config.type === PropertyType.OAUTH2) {
      this.editOAuth2Property(currentConnection$);
    } else if (this.config.type === PropertyType.SECRET_TEXT) {
      this.editSecretKeyConnection(currentConnection$);
    } else {
      this.editBasicAuthConnection(currentConnection$);
    }
  }

  private editSecretKeyConnection(
    currentConnection$: Observable<AppConnection>
  ) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        const secretKeyConnection = connection as SecretKeyAppConnection;
        const dialogData: SecretTextConnectionDialogData = {
          pieceName: this.pieceName,
          displayName: this.config.label,
          description: this.config.description || '',
          connectionName: connection!.name,
          secretText: secretKeyConnection.value.secret_text,
        };
        return this.dialogService
          .open(SecretTextConnectionDialogComponent, {
            data: dialogData,
          })
          .afterClosed();
      })
    );
  }
  private editBasicAuthConnection(
    currentConnection$: Observable<AppConnection>
  ) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        const dialogData: BasicAuthDialogData = {
          pieceName: this.pieceName,
          pieceAuthConfig: this.config,
          connectionToUpdate: connection as BasicAuthConnection,
        };

        return this.dialogService
          .open(BasicAuthConnectionDialogComponent, {
            data: dialogData,
          })
          .afterClosed();
      })
    );
  }

  private editOAuth2Property(currentConnection$: Observable<AppConnection>) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        if (connection.value.type === AppConnectionType.OAUTH2) {
          return this.dialogService
            .open(OAuth2ConnectionDialogComponent, {
              data: {
                connectionToUpdate: connection,
                pieceAuthConfig: this.config,
                pieceName: this.pieceName,
              },
            })
            .afterClosed()
            .pipe(map(() => void 0));
        } else {
          if (!this.checkingOAuth2CloudManager$.value) {
            this.checkingOAuth2CloudManager$.next(true);
          }
          return this.cloudAuthConfigsService.getAppsAndTheirClientIds().pipe(
            tap(() => {
              this.checkingOAuth2CloudManager$.next(false);
            }),
            switchMap((res) => {
              const clientId = res[this.pieceName].clientId;
              return this.dialogService
                .open(CloudOAuth2ConnectionDialogComponent, {
                  data: {
                    connectionToUpdate: connection,
                    pieceAuthConfig: this.config,
                    pieceName: this.pieceName,
                    clientId: clientId,
                  },
                })
                .afterClosed()
                .pipe(map(() => void 0));
            })
          );
        }
      })
    );
  }

  getConnectionNameFromInterpolatedString(interpolatedString: string) {
    //eg. ${connections.google}
    const result = interpolatedString.split('${connections.')[1];
    return result.slice(0, result.length - 1);
  }
}
