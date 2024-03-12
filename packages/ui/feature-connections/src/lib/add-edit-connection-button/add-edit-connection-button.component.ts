import {
  AppConnection,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  OAuth2AppConnection,
} from '@activepieces/shared';
import {
  BasicAuthProperty,
  CustomAuthProperty,
  CustomAuthProps,
  OAuth2Props,
  PropertyType,
  SecretTextProperty,
} from '@activepieces/pieces-framework';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { map, Observable, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { FlagService, appConnectionsSelectors } from '@activepieces/ui/common';
import { CloudAuthConfigsService } from '../services/cloud-auth-configs.service';
import {
  CustomAuthConnectionDialogComponent,
  CustomAuthDialogData,
} from '../dialogs/custom-auth-connection-dialog/custom-auth-connection-dialog.component';
import {
  BasicAuthConnectionDialogComponent,
  BasicAuthDialogData,
} from '../dialogs/basic-auth-connection-dialog/basic-auth-connection-dialog.component';
import {
  SecretTextConnectionDialogComponent,
  SecretTextConnectionDialogData,
} from '../dialogs/secret-text-connection-dialog/secret-text-connection-dialog.component';
import {
  OAuth2ConnectionDialogComponent,
  OAuth2ConnectionDialogData,
  USE_CLOUD_CREDENTIALS,
} from '../dialogs/oauth2-connection-dialog/oauth2-connection-dialog.component';
import {
  ManagedOAuth2ConnectionDialogComponent,
  ManagedOAuth2ConnectionDialogData,
  USE_MY_OWN_CREDENTIALS,
} from '../dialogs/managed-oauth2-connection-dialog/managed-oauth2-connection-dialog.component';
import {
  PieceOAuth2DetailsValue,
  checkIfTriggerIsAppWebhook,
  getConnectionNameFromInterpolatedString,
} from './utils';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { OAuth2Property } from '@activepieces/pieces-framework';

@Component({
  selector: 'app-add-edit-connection-button',
  templateUrl: './add-edit-connection-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditConnectionButtonComponent {
  @Output() newConnectionDialogClosed = new EventEmitter();
  @Input()
  btnSize: 'extraSmall' | 'small' | 'medium' | 'large' | 'default';
  @Input({ required: true })
  authProperty:
    | OAuth2Property<OAuth2Props>
    | CustomAuthProperty<CustomAuthProps>
    | SecretTextProperty<boolean>
    | BasicAuthProperty;
  @Input()
  propertyKey: string;
  @Input()
  selectedConnectionInterpolatedString: string;
  @Input({ required: true })
  pieceName: string;
  @Input({ required: true })
  pieceVersion: string;
  @Input()
  isEditConnectionButton = false;
  @Input()
  triggerName: string;
  @Input({ required: true }) pieceDisplayName: string;
  @Output()
  connectionPropertyValueChanged: EventEmitter<{
    propertyKey: string;
    value: `{{connections['${string}']}}`;
  }> = new EventEmitter();
  @Output()
  newConnection: EventEmitter<{
    name: string;
    id: string;
  }> = new EventEmitter();
  updateOrAddConnectionDialogClosed$: Observable<void>;
  checkConnectionLimitThenOpenDialog$: Observable<void>;
  appsAndTheirClientIds$ = this.cloudAuthConfigsService
    .getAppsAndTheirClientIds()
    .pipe(shareReplay(1));
  updateConnectionTap = tap((connection: AppConnection | null) => {
    if (connection) {
      this.emitNewConnection(connection);
    }
  });
  constructor(
    private store: Store,
    private dialogService: MatDialog,
    private cloudAuthConfigsService: CloudAuthConfigsService,
    private flagService: FlagService,
    private pieceMetadataService: PieceMetadataService,
    private cd: ChangeDetectorRef
  ) {
    //ignore
  }

  buttonClicked() {
    this.dialogService.closeAll();
    if (this.isEditConnectionButton) {
      this.editConnection();
    } else {
      this.checkConnectionLimitThenOpenDialog$ =
        this.openConnectionDialogAcordingToConnectionType().pipe(
          tap(() => {
            this.newConnectionDialogClosed.emit();
          })
        );
    }
    this.cd.markForCheck();
  }

  private openConnectionDialogAcordingToConnectionType() {
    switch (this.authProperty.type) {
      case PropertyType.OAUTH2:
        return this.newOAuth2AuthenticationDialogProcess();
      case PropertyType.SECRET_TEXT:
        return this.openNewSecretKeyConnection();
      case PropertyType.CUSTOM_AUTH:
        return this.openNewCustomAuthConnection();
      case PropertyType.BASIC_AUTH: {
        return this.openNewBasicAuthConnection();
      }
    }
  }

  private openNewCustomAuthConnection(): Observable<void> {
    const dialogData: CustomAuthDialogData = {
      pieceAuthProperty: this
        .authProperty as CustomAuthProperty<CustomAuthProps>,
      pieceName: this.pieceName,
      pieceDisplayName: this.pieceDisplayName,
    };

    return this.dialogService
      .open(CustomAuthConnectionDialogComponent, {
        data: dialogData,
      })
      .afterClosed()
      .pipe(
        this.updateConnectionTap,
        map(() => void 0)
      );
  }

  private emitNewConnection(result: AppConnection) {
    const authConfigOptionValue: `{{connections['${string}']}}` = `{{connections['${result.name}']}}`;
    this.connectionPropertyValueChanged.emit({
      propertyKey: this.propertyKey,
      value: authConfigOptionValue,
    });
    this.newConnection.emit({
      name: result.name,
      id: result.id,
    });
  }

  private openNewBasicAuthConnection(): Observable<void> {
    const dialogData: BasicAuthDialogData = {
      pieceAuthProperty: this.authProperty as BasicAuthProperty,
      pieceName: this.pieceName,
      pieceDisplayName: this.pieceDisplayName,
    };
    return this.dialogService
      .open(BasicAuthConnectionDialogComponent, {
        data: dialogData,
      })
      .afterClosed()
      .pipe(
        this.updateConnectionTap,
        map(() => void 0)
      );
  }
  private openNewSecretKeyConnection(): Observable<void> {
    const dialogData: SecretTextConnectionDialogData = {
      pieceName: this.pieceName,
      displayName: this.authProperty.displayName,
      description: this.authProperty.description || '',
      pieceDisplayName: this.pieceDisplayName,
    };
    return this.dialogService
      .open(SecretTextConnectionDialogComponent, {
        data: dialogData,
      })
      .beforeClosed()
      .pipe(
        this.updateConnectionTap,
        map(() => {
          return void 0;
        })
      );
  }

  private newOAuth2AuthenticationDialogProcess(): Observable<void> {
    return this.appsAndTheirClientIds$.pipe(
      map((res) => {
        return res[this.pieceName];
      }),
      switchMap((res: PieceOAuth2DetailsValue) => {
        return this.pieceMetadataService
          .getPieceMetadata(this.pieceName, this.pieceVersion)
          .pipe(
            map((p) => {
              const isTriggerAppWebhook = checkIfTriggerIsAppWebhook(
                p,
                this.triggerName
              );
              return {
                managedOAuth2Config: res,
                isTriggerAppWebhook: isTriggerAppWebhook,
              };
            })
          );
      }),
      switchMap(
        (res: {
          managedOAuth2Config: PieceOAuth2DetailsValue;
          isTriggerAppWebhook: boolean;
        }) => {
          if (res.managedOAuth2Config) {
            return this.openNewManagedOAuth2ConnectionModal(
              res.managedOAuth2Config,
              res.isTriggerAppWebhook
            );
          }
          return this.openNewOAuth2ConnectionDialog();
        }
      ),
      map(() => void 0)
    );
  }
  private openNewOAuth2ConnectionDialog(): Observable<void> {
    return this.flagService.getFrontendUrl().pipe(
      switchMap((frontEndUrl) => {
        const data: OAuth2ConnectionDialogData = {
          pieceAuthProperty: this.authProperty as OAuth2Property<OAuth2Props>,
          pieceName: this.pieceName,
          redirectUrl: frontEndUrl + '/redirect',
          pieceDisplayName: this.pieceDisplayName,
        };

        return this.dialogService
          .open(OAuth2ConnectionDialogComponent, {
            data,
          })
          .afterClosed()
          .pipe(
            switchMap((result: OAuth2AppConnection | string) => {
              if (typeof result === 'object') {
                this.emitNewConnection(result);
              }
              if (
                typeof result === 'string' &&
                result === USE_CLOUD_CREDENTIALS
              ) {
                return this.appsAndTheirClientIds$.pipe(
                  map((res) => {
                    return res[this.pieceName];
                  }),
                  switchMap((managedOAuth2Config: PieceOAuth2DetailsValue) => {
                    return this.openNewManagedOAuth2ConnectionModal(
                      managedOAuth2Config,
                      false
                    );
                  }),
                  map(() => void 0)
                );
              }
              return of(void 0);
            })
          );
      })
    );
  }

  private openNewManagedOAuth2ConnectionModal(
    pieceOAuth2Details: PieceOAuth2DetailsValue,
    isTriggerAppWebhook: boolean
  ) {
    return this.flagService.getFrontendUrl().pipe(
      switchMap((frontendUrl) => {
        if (this.authProperty.type === PropertyType.OAUTH2) {
          const data: ManagedOAuth2ConnectionDialogData = {
            pieceAuthProperty: this.authProperty,
            pieceName: this.pieceName,
            clientId: pieceOAuth2Details.clientId,
            isTriggerAppWebhook: isTriggerAppWebhook,
            connectionType: pieceOAuth2Details.connectionType,
            frontendUrl,
            pieceDisplayName: this.pieceDisplayName,
          };
          return this.dialogService
            .open(ManagedOAuth2ConnectionDialogComponent, {
              data,
            })
            .afterClosed()
            .pipe(
              switchMap((result: AppConnection | string) => {
                if (typeof result === 'object') {
                  this.emitNewConnection(result);
                } else if (result === USE_MY_OWN_CREDENTIALS) {
                  return this.openNewOAuth2ConnectionDialog();
                }
                return of(void 0);
              })
            );
        }
        return of(void 0);
      })
    );
  }

  private editConnection() {
    const allConnections$ = this.store.select(
      appConnectionsSelectors.selectAllAppConnections
    );
    const currentConnection$ = allConnections$.pipe(
      take(1),
      map((connections) => {
        const connection = connections.find(
          (c) =>
            c.name ===
            getConnectionNameFromInterpolatedString(
              this.selectedConnectionInterpolatedString
            )
        );
        return connection!;
      })
    );
    switch (this.authProperty.type) {
      case PropertyType.OAUTH2: {
        this.editOAuth2Property(currentConnection$);
        break;
      }
      case PropertyType.SECRET_TEXT: {
        this.editSecretKeyConnection(currentConnection$);
        break;
      }
      case PropertyType.BASIC_AUTH: {
        this.editBasicAuthConnection(currentConnection$);
        break;
      }
      case PropertyType.CUSTOM_AUTH: {
        this.editCustomAuthConnection(currentConnection$);
        break;
      }
    }
  }

  private editCustomAuthConnection(
    currentConnection$: Observable<AppConnectionWithoutSensitiveData>
  ) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        const customAuthConnection = connection;
        const dialogData: CustomAuthDialogData = {
          pieceName: this.pieceName,
          pieceAuthProperty: this
            .authProperty as CustomAuthProperty<CustomAuthProps>,
          connectionToUpdate: customAuthConnection,
          pieceDisplayName: this.pieceDisplayName,
        };
        return this.dialogService
          .open(CustomAuthConnectionDialogComponent, {
            data: dialogData,
          })
          .afterClosed()
          .pipe(
            this.updateConnectionTap,
            map(() => void 0)
          );
      })
    );
  }

  private editSecretKeyConnection(
    currentConnection$: Observable<AppConnectionWithoutSensitiveData>
  ) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        const dialogData: SecretTextConnectionDialogData = {
          pieceName: this.pieceName,
          displayName: this.authProperty.displayName,
          description: this.authProperty.description || '',
          connectionName: connection!.name,
          pieceDisplayName: this.pieceDisplayName,
        };
        return this.dialogService
          .open(SecretTextConnectionDialogComponent, {
            data: dialogData,
          })
          .afterClosed()
          .pipe(
            this.updateConnectionTap,
            map(() => void 0)
          );
      })
    );
  }
  private editBasicAuthConnection(
    currentConnection$: Observable<AppConnectionWithoutSensitiveData>
  ) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        const dialogData: BasicAuthDialogData = {
          pieceName: this.pieceName,
          pieceAuthProperty: this.authProperty as BasicAuthProperty,
          connectionToUpdate: connection,
          pieceDisplayName: this.pieceDisplayName,
        };

        return this.dialogService
          .open(BasicAuthConnectionDialogComponent, {
            data: dialogData,
          })
          .afterClosed()
          .pipe(
            this.updateConnectionTap,
            map(() => void 0)
          );
      })
    );
  }

  private editOAuth2Property(
    currentConnection$: Observable<AppConnectionWithoutSensitiveData>
  ) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        return this.flagService.getFrontendUrl().pipe(
          switchMap((frontendUrl) => {
            if (
              connection.type === AppConnectionType.OAUTH2 &&
              this.authProperty.type === PropertyType.OAUTH2
            ) {
              const data: OAuth2ConnectionDialogData = {
                connectionToUpdate: connection,
                pieceAuthProperty: this.authProperty,
                pieceName: this.pieceName,
                redirectUrl: frontendUrl + '/redirect',
                pieceDisplayName: this.pieceDisplayName,
              };
              return this.dialogService
                .open(OAuth2ConnectionDialogComponent, {
                  data,
                })
                .afterClosed()
                .pipe(
                  this.updateConnectionTap,
                  map(() => void 0)
                );
            } else {
              return this.appsAndTheirClientIds$.pipe(
                switchMap((res) => {
                  if (this.authProperty.type === PropertyType.OAUTH2) {
                    const pieceOAuth2Details = res[this.pieceName];
                    const data: ManagedOAuth2ConnectionDialogData = {
                      connectionToUpdate: connection,
                      pieceAuthProperty: this.authProperty,
                      pieceName: this.pieceName,
                      clientId: pieceOAuth2Details.clientId,
                      isTriggerAppWebhook: false,
                      connectionType: pieceOAuth2Details.connectionType,
                      frontendUrl,
                      pieceDisplayName: this.pieceDisplayName,
                    };
                    return this.dialogService
                      .open(ManagedOAuth2ConnectionDialogComponent, {
                        data,
                      })
                      .afterClosed()
                      .pipe(
                        this.updateConnectionTap,
                        map(() => void 0)
                      );
                  }
                  return of(void 0);
                })
              );
            }
          })
        );
      })
    );
  }
}
