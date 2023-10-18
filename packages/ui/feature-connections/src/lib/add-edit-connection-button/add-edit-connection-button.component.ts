import {
  AppConnection,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  OAuth2AppConnection,
} from '@activepieces/shared';
import {
  BasicAuthProperty,
  CustomAuthProperty,
  OAuth2Property,
  OAuth2Props,
  PropertyType,
  SecretTextProperty,
  CustomAuthProps,
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

import { PieceMetadataService, FlagService } from '@activepieces/ui/common';
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
import {
  BillingService,
  UpgradeDialogComponent,
} from '@activepieces/ee-billing-ui';

@Component({
  selector: 'app-add-edit-connection-button',
  templateUrl: './add-edit-connection-button.component.html',
  styleUrls: [],
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
    | OAuth2Property<boolean, OAuth2Props>
    | CustomAuthProperty<boolean, CustomAuthProps>
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
    value: `{{connections['${string}']}}`;
  }> = new EventEmitter();

  @Output()
  connectionIdChanged: EventEmitter<{
    propertyKey: string;
    value: string;
  }> = new EventEmitter();
  updateOrAddConnectionDialogClosed$: Observable<void>;
  checkConnectionLimit$: Observable<{ limit: number; exceeded: boolean }>;
  cloudAuthCheck$: Observable<void>;
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
    private cd: ChangeDetectorRef,
    private billingService: BillingService
  ) {}

  buttonClicked() {
    if (this.isEditConnectionButton) {
      this.editConnection();
    } else {
      this.checkThenOpenConnection();
    }
    this.cd.markForCheck();
  }

  // BEGIN EE
  private checkThenOpenConnection() {
    this.checkConnectionLimit$ = this.billingService
      .checkConnectionLimit()
      .pipe(
        tap((limitExceeded) => {
          if (limitExceeded.exceeded) {
            return this.dialogService.open(UpgradeDialogComponent, {
              data: {
                limitType: 'connections',
                limit: limitExceeded.limit,
              },
            });
          }
          const authDialogMap: Partial<Record<PropertyType, () => void>> = {
            [PropertyType.OAUTH2]: this.newOAuth2AuthenticationDialogProcess,
            [PropertyType.SECRET_TEXT]: this.openNewSecretKeyConnection,
            [PropertyType.CUSTOM_AUTH]: this.openNewCustomAuthConnection,
            [PropertyType.BASIC_AUTH]: this.openNewBasicAuthConnection,
          };

          const authDialog = authDialogMap[this.authProperty.type];
          return authDialog?.call(this);
        })
      );
  }

  // END EE

  private openNewCustomAuthConnection() {
    const dialogData: CustomAuthDialogData = {
      pieceAuthProperty: this.authProperty as CustomAuthProperty<
        boolean,
        CustomAuthProps
      >,
      pieceName: this.pieceName,
    };

    this.updateOrAddConnectionDialogClosed$ = this.dialogService
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
    this.connectionIdChanged.emit({
      propertyKey: this.propertyKey,
      value: result.id,
    });
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
        this.updateConnectionTap,
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
        this.updateConnectionTap,
        map(() => {
          return void 0;
        })
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
            return this.pieceMetadataService
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
              OAuth2Props
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
                  this.emitNewConnection(result);
                }
              }),
              map(() => void 0)
            );
        })
      );
    this.cd.detectChanges();
  }

  private openNewCloudOAuth2ConnectionModal(
    clientId: string,
    isTriggerAppWebhook: boolean
  ) {
    this.updateOrAddConnectionDialogClosed$ = this.dialogService
      .open(CloudOAuth2ConnectionDialogComponent, {
        data: {
          pieceAuthProperty: this.authProperty,
          pieceName: this.pieceName,
          clientId: clientId,
          isTriggerAppWebhook: isTriggerAppWebhook,
        },
      })
      .afterClosed()
      .pipe(
        tap((result: AppConnection | string) => {
          if (typeof result === 'object') {
            this.emitNewConnection(result);
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
    currentConnection$: Observable<AppConnectionWithoutSensitiveData>
  ) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(
      switchMap((connection) => {
        const customAuthConnection = connection;
        const dialogData: CustomAuthDialogData = {
          pieceName: this.pieceName,
          pieceAuthProperty: this.authProperty as CustomAuthProperty<
            boolean,
            CustomAuthProps
          >,
          connectionToUpdate: customAuthConnection,
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
          pieceAuthProperty: this.authProperty as BasicAuthProperty<boolean>,
          connectionToUpdate: connection,
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
        if (connection.type === AppConnectionType.OAUTH2) {
          return this.dialogService
            .open(OAuth2ConnectionDialogComponent, {
              data: {
                connectionToUpdate: connection,
                pieceAuthProperty: this.authProperty,
                pieceName: this.pieceName,
              },
            })
            .afterClosed()
            .pipe(
              this.updateConnectionTap,
              map(() => void 0)
            );
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
                    pieceAuthProperty: this.authProperty,
                    pieceName: this.pieceName,
                    clientId: clientId,
                  },
                })
                .afterClosed()
                .pipe(
                  this.updateConnectionTap,
                  map(() => void 0)
                );
            })
          );
        }
      })
    );
  }

  getConnectionNameFromInterpolatedString(interpolatedString: string) {
    //eg. {{connections.google}}
    if (interpolatedString.includes('[')) {
      const result = interpolatedString.substring(`{{connections['`.length);
      return result.slice(0, result.length - 4);
    }
    const result = interpolatedString.substring(`{{connections.`.length);
    return result.slice(0, result.length - 4);
  }
}
