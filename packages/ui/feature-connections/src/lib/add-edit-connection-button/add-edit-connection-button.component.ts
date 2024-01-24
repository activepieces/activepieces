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
import {
  BehaviorSubject,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { FlagService, ProjectSelectors } from '@activepieces/ui/common';
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
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import {
  BillingService,
  UpgradeDialogComponent,
  UpgradeDialogData,
} from '@activepieces/ee-billing-ui';
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
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditConnectionButtonComponent {
  @Input()
  btnSize: 'extraSmall' | 'small' | 'medium' | 'large' | 'default';
  checkingOAuth2ManagedConnections$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  @Input()
  authProperty:
    | OAuth2Property<OAuth2Props>
    | CustomAuthProperty<CustomAuthProps>
    | SecretTextProperty<boolean>
    | BasicAuthProperty;
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
  checkConnectionLimitThenOpenDialog$: Observable<void>;
  managedOAuth2Check$: Observable<void>;
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

  private checkThenOpenConnection() {
    this.checkConnectionLimitThenOpenDialog$ =
      this.getCurrentProjectAndConnectionLimit$().pipe(
        tap((res) => {
          if (res.limit.exceeded) {
            const data: UpgradeDialogData = {
              limit: res.limit.limit,
              limitType: 'connections',
              projectType: res.project.type,
            };
            this.dialogService.open(UpgradeDialogComponent, {
              data,
            });
          } else {
            this.openConnectionDialogAcordingToConnectionType();
          }
        }),
        map(() => void 0)
      );
  }

  private openConnectionDialogAcordingToConnectionType() {
    const authDialogMap: Record<
      | PropertyType.OAUTH2
      | PropertyType.SECRET_TEXT
      | PropertyType.CUSTOM_AUTH
      | PropertyType.BASIC_AUTH,
      () => void
    > = {
      [PropertyType.OAUTH2]: this.newOAuth2AuthenticationDialogProcess,
      [PropertyType.SECRET_TEXT]: this.openNewSecretKeyConnection,
      [PropertyType.CUSTOM_AUTH]: this.openNewCustomAuthConnection,
      [PropertyType.BASIC_AUTH]: this.openNewBasicAuthConnection,
    };
    const authDialog = authDialogMap[this.authProperty.type];
    authDialog.call(this);
  }
  private getCurrentProjectAndConnectionLimit$() {
    return this.store.select(ProjectSelectors.selectCurrentProject).pipe(
      switchMap((project) => {
        return this.billingService.checkConnectionLimit().pipe(
          map((limit) => {
            return {
              project,
              limit,
            };
          })
        );
      })
    );
  }
  private openNewCustomAuthConnection() {
    const dialogData: CustomAuthDialogData = {
      pieceAuthProperty: this
        .authProperty as CustomAuthProperty<CustomAuthProps>,
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
    this.cd.detectChanges();
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
      pieceAuthProperty: this.authProperty as BasicAuthProperty,
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
      .beforeClosed()
      .pipe(
        this.updateConnectionTap,
        map(() => {
          return void 0;
        })
      );
    this.cd.detectChanges();
  }

  private newOAuth2AuthenticationDialogProcess() {
    if (!this.checkingOAuth2ManagedConnections$.value) {
      this.checkingOAuth2ManagedConnections$.next(true);
      this.managedOAuth2Check$ = this.cloudAuthConfigsService
        .getAppsAndTheirClientIds()
        .pipe(
          tap(() => {
            this.checkingOAuth2ManagedConnections$.next(false);
          }),
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
          tap(
            (res: {
              managedOAuth2Config: PieceOAuth2DetailsValue;
              isTriggerAppWebhook: boolean;
            }) => {
              if (res.managedOAuth2Config) {
                this.openNewManagedOAuth2ConnectionModal(
                  res.managedOAuth2Config,
                  res.isTriggerAppWebhook
                );
              } else {
                this.openNewOAuth2ConnectionDialog();
              }
            }
          ),
          map(() => void 0)
        );
      this.cd.detectChanges();
    }
  }
  private openNewOAuth2ConnectionDialog() {
    this.updateOrAddConnectionDialogClosed$ = this.flagService
      .getFrontendUrl()
      .pipe(
        switchMap((frontEndUrl) => {
          const data: OAuth2ConnectionDialogData = {
            pieceAuthProperty: this.authProperty as OAuth2Property<OAuth2Props>,
            pieceName: this.pieceName,
            redirectUrl: frontEndUrl + '/redirect',
          };
          return this.dialogService
            .open(OAuth2ConnectionDialogComponent, {
              data,
            })
            .afterClosed()
            .pipe(
              tap((result: OAuth2AppConnection | string) => {
                if (
                  typeof result === 'string' &&
                  result === USE_CLOUD_CREDENTIALS
                ) {
                  this.checkingOAuth2ManagedConnections$.next(true);
                  this.managedOAuth2Check$ = this.cloudAuthConfigsService
                    .getAppsAndTheirClientIds()
                    .pipe(
                      tap(() => {
                        this.checkingOAuth2ManagedConnections$.next(false);
                      }),
                      map((res) => {
                        return res[this.pieceName];
                      }),
                      tap((managedOAuth2Config: PieceOAuth2DetailsValue) => {
                        this.openNewManagedOAuth2ConnectionModal(
                          managedOAuth2Config,
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

  private openNewManagedOAuth2ConnectionModal(
    pieceOAuth2Details: PieceOAuth2DetailsValue,
    isTriggerAppWebhook: boolean
  ) {
    this.updateOrAddConnectionDialogClosed$ = this.flagService
      .getFrontendUrl()
      .pipe(
        switchMap((frontendUrl) => {
          if (this.authProperty.type === PropertyType.OAUTH2) {
            const data: ManagedOAuth2ConnectionDialogData = {
              pieceAuthProperty: this.authProperty,
              pieceName: this.pieceName,
              clientId: pieceOAuth2Details.clientId,
              isTriggerAppWebhook: isTriggerAppWebhook,
              connectionType: pieceOAuth2Details.connectionType,
              frontendUrl,
            };
            return this.dialogService
              .open(ManagedOAuth2ConnectionDialogComponent, {
                data,
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
          return of(void 0);
        })
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
            getConnectionNameFromInterpolatedString(
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
          pieceAuthProperty: this
            .authProperty as CustomAuthProperty<CustomAuthProps>,
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
          pieceAuthProperty: this.authProperty as BasicAuthProperty,
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
              if (!this.checkingOAuth2ManagedConnections$.value) {
                this.checkingOAuth2ManagedConnections$.next(true);
              }
              return this.cloudAuthConfigsService
                .getAppsAndTheirClientIds()
                .pipe(
                  tap(() => {
                    this.checkingOAuth2ManagedConnections$.next(false);
                  }),
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
