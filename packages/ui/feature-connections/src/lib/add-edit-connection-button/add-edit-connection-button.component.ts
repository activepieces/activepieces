import {
  AppConnection,
  AppConnectionType,
  BasicAuthConnection,
  BasicAuthProperty,
  CustomAuthConnection,
  CustomAuthProperty,
  OAuth2AppConnection,
  OAuth2Property,
  OAuth2Prop,
  PropertyType,
  SecretKeyAppConnection,
  SecretTextProperty,
  CustomAuthProp,
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

import { ActionMetaService, FlagService } from '@activepieces/ui/common';
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
  CloudOAuth2ConnectionDialogComponent,
  USE_MY_OWN_CREDENTIALS,
} from '../dialogs/cloud-oauth2-connection-dialog/cloud-oauth2-connection-dialog.component';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';

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
  authProperty:
    | OAuth2Property<boolean, Record<string, OAuth2Prop>>
    | CustomAuthProperty<boolean, Record<string, CustomAuthProp>>
    | SecretTextProperty<boolean>
    | BasicAuthProperty<boolean>;
  @Input()
  propertyKey: string;
  @Input()
  selectedConnectionInterpolatedString: string;
  @Input()
  pieceName: string;
  @Input()
  pieceVersion: string;
  @Input()
  isEditConnectionButton = false;
  @Input()
  triggerName: string;
  @Output()
  connectionPropertyValueChanged: EventEmitter<{
    propertyKey: string;
    value: `\${connections.${string}}`;
  }> = new EventEmitter();
  updateOrAddConnectionDialogClosed$: Observable<void>;
  cloudAuthCheck$: Observable<void>;
  constructor(
    private store: Store,
    private dialogService: MatDialog,
    private cloudAuthConfigsService: CloudAuthConfigsService,
    private flagService: FlagService,
    private actionMetaService: ActionMetaService
  ) {}

  buttonClicked() {
    if (this.isEditConnectionButton) {
      this.editConnection();
    } else {
      this.newConnectionDialogProcess();
    }
  }

  private newConnectionDialogProcess() {
    if (this.authProperty.type === PropertyType.OAUTH2) {
      this.newOAuth2AuthenticationDialogProcess();
    } else if (this.authProperty.type === PropertyType.SECRET_TEXT) {
      this.openNewSecretKeyConnection();
    } else if (this.authProperty.type === PropertyType.CUSTOM_AUTH) {
      this.openNewCustomAuthConnection();
    } else {
      this.openNewBasicAuthConnection();
    }
  }

  private openNewCustomAuthConnection() {
    const dialogData: CustomAuthDialogData = {
      pieceAuthProperty: this.authProperty as CustomAuthProperty<
        boolean,
        Record<string, CustomAuthProp>
      >,
      pieceName: this.pieceName,
    };

    this.updateOrAddConnectionDialogClosed$ = this.dialogService
      .open(CustomAuthConnectionDialogComponent, {
        data: dialogData,
      })
      .afterClosed()
      .pipe(
        tap((result: AppConnection | null) => {
          if (result) {
            const authConfigOptionValue: `\${connections.${string}}` = `\${connections.${result.name}}`;
            this.connectionPropertyValueChanged.emit({
              propertyKey: this.propertyKey,
              value: authConfigOptionValue,
            });
          }
        }),
        map(() => void 0)
      );
  }

  private openNewBasicAuthConnection() {
    const dialogData: BasicAuthDialogData = {
      pieceAuthProperty: this.authProperty as BasicAuthProperty<boolean>,
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
              propertyKey: this.propertyKey,
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
      displayName: this.authProperty.displayName,
      description: this.authProperty.description || '',
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
              propertyKey: this.propertyKey,
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
            return of({} as Record<string, { clientId: string }>);
          }),
          tap(() => {
            this.checkingOAuth2CloudManager$.next(false);
          }),
          map((res) => {
            return res[this.pieceName];
          }),
          switchMap((res: { clientId: string }) => {
            return this.actionMetaService
              .getPieceMetadata(this.pieceName, this.pieceVersion)
              .pipe(
                map((p) => {
                  let isTriggerAppWebhook = false;
                  Object.keys(p.triggers).forEach((k) => {
                    isTriggerAppWebhook =
                      isTriggerAppWebhook ||
                      (this.triggerName === k &&
                        p.triggers[k].type === 'APP_WEBHOOK');
                  });
                  return {
                    cloudAuth2Config: res,
                    isTriggerAppWebhook: isTriggerAppWebhook,
                  };
                })
              );
          }),
          tap(
            (res: {
              cloudAuth2Config: { clientId: string };
              isTriggerAppWebhook: boolean;
            }) => {
              if (res.cloudAuth2Config) {
                this.openNewCloudOAuth2ConnectionModal(
                  res.cloudAuth2Config.clientId,
                  res.isTriggerAppWebhook
                );
              } else {
                this.openNewOAuth2ConnectionDialog();
              }
            }
          ),
          map(() => void 0)
        );
    }
  }
  private openNewOAuth2ConnectionDialog() {
    this.updateOrAddConnectionDialogClosed$ = this.flagService
      .getFrontendUrl()
      .pipe(
        switchMap((serverUrl) => {
          const dialogData: OAuth2ConnectionDialogData = {
            pieceAuthProperty: this.authProperty as OAuth2Property<
              boolean,
              Record<string, OAuth2Prop>
            >,
            pieceName: this.pieceName,
            serverUrl: serverUrl,
          };
          return this.dialogService
            .open(OAuth2ConnectionDialogComponent, {
              data: dialogData,
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
                        return of({} as Record<string, { clientId: string }>);
                      }),
                      tap(() => {
                        this.checkingOAuth2CloudManager$.next(false);
                      }),
                      map((res) => {
                        return res[this.pieceName];
                      }),
                      tap((cloudAuth2Config: { clientId: string }) => {
                        this.openNewCloudOAuth2ConnectionModal(
                          cloudAuth2Config.clientId,
                          false
                        );
                      }),
                      map(() => void 0)
                    );
                } else if (typeof result === 'object') {
                  const authConfigOptionValue: `\${connections.${string}}` = `\${connections.${result.name}}`;
                  this.connectionPropertyValueChanged.emit({
                    propertyKey: this.propertyKey,
                    value: authConfigOptionValue,
                  });
                }
              }),
              map(() => void 0)
            );
        })
      );
  }

  private openNewCloudOAuth2ConnectionModal(
    clientId: string,
    isTriggerAppWebhook: boolean
  ) {
    this.updateOrAddConnectionDialogClosed$ = this.dialogService
      .open(CloudOAuth2ConnectionDialogComponent, {
        data: {
          pieceAuthConfig: this.authProperty,
          pieceName: this.pieceName,
          clientId: clientId,
          isTriggerAppWebhook: isTriggerAppWebhook,
        },
      })
      .afterClosed()
      .pipe(
        tap((result: AppConnection | string) => {
          if (typeof result === 'object') {
            const authConfigOptionValue: `\${connections.${string}}` = `\${connections.${result.name}}`;
            this.connectionPropertyValueChanged.emit({
              propertyKey: this.propertyKey,
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
    if (this.authProperty.type === PropertyType.OAUTH2) {
      this.editOAuth2Property(currentConnection$);
    } else if (this.authProperty.type === PropertyType.CUSTOM_AUTH) {
      this.editCustomAuthConnection(currentConnection$);
    } else if (this.authProperty.type === PropertyType.SECRET_TEXT) {
      this.editSecretKeyConnection(currentConnection$);
    } else {
      this.editBasicAuthConnection(currentConnection$);
    }
  }

  private editCustomAuthConnection(
    currentConnection$: Observable<AppConnection>
  ) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        const customAuthConnection = connection as CustomAuthConnection;
        const dialogData: CustomAuthDialogData = {
          pieceName: this.pieceName,
          pieceAuthProperty: this.authProperty as CustomAuthProperty<
            boolean,
            Record<string, CustomAuthProp>
          >,
          connectionToUpdate: customAuthConnection,
        };
        return this.dialogService
          .open(CustomAuthConnectionDialogComponent, {
            data: dialogData,
          })
          .afterClosed();
      })
    );
  }

  private editSecretKeyConnection(
    currentConnection$: Observable<AppConnection>
  ) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        const secretKeyConnection = connection as SecretKeyAppConnection;
        const dialogData: SecretTextConnectionDialogData = {
          pieceName: this.pieceName,
          displayName: this.authProperty.displayName,
          description: this.authProperty.description || '',
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
          pieceAuthProperty: this.authProperty as BasicAuthProperty<boolean>,
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
                pieceAuthConfig: this.authProperty,
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
                    pieceAuthConfig: this.authProperty,
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
