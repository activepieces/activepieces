import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  ActionMetaService,
  DropdownState,
} from 'packages/frontend/src/app/modules/flow-builder/service/action-meta.service';
import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { ThemeService } from '../../service/theme.service';
import { PieceConfig, PropertyType } from './connector-action-or-config';
import { MatDialog } from '@angular/material/dialog';
import {
  ApiKeyAppConnection,
  AppConnection,
  AppConnectionType,
  OAuth2AppConnection,
} from '@activepieces/shared';
import { DropdownItem } from '../../model/dropdown-item.interface';
import { AuthenticationService } from '../../service/authentication.service';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { BuilderSelectors } from 'packages/frontend/src/app/modules/flow-builder/store/builder/builder.selector';
import deepEqual from 'deep-equal';
import { CloudAuthConfigsService } from '../../service/cloud-auth-configs.service';
import {
  OAuth2ConnectionDialogComponent,
  USE_CLOUD_CREDENTIALS,
} from '../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/oauth2-connection-dialog/oauth2-connection-dialog.component';
import {
  CloudOAuth2ConnectionDialogComponent,
  USE_MY_OWN_CREDENTIALS,
} from '../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/cloud-oauth2-connection-dialog/cloud-oauth2-connection-dialog.component';
import {
  SecretTextConnectionDialogComponent,
  SecretTextConnectionDialogData,
} from '../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/secret-text-connection-dialog/secret-text-connection-dialog.component';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { InsertMentionOperation } from '../form-controls/interpolating-text-form-control/utils';
import { jsonValidator } from '../../validators/json-validator';
import { CodeService } from '../../../flow-builder/service/code.service';
type ConfigKey = string;

@Component({
  selector: 'app-configs-form',
  templateUrl: './configs-form.component.html',
  styleUrls: ['./configs-form.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ConfigsFormComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: ConfigsFormComponent,
    },
  ],
  animations: [fadeInUp400ms],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigsFormComponent implements ControlValueAccessor {
  editorOptions = {
    lineNumbers: true,
    theme: 'lucario',
    mode: 'javascript',
  };
  faInfoCircle = faInfoCircle;
  checkingOAuth2CloudManager = false;
  configs: PieceConfig[] = [];
  requiredConfigs: PieceConfig[] = [];
  allOptionalConfigs: PieceConfig[] = [];
  selectedOptionalConfigs: PieceConfig[] = [];
  optionalConfigsMenuOpened = false;
  @Input() stepName: string;
  @Input() pieceName: string;
  @Input() pieceDisplayName: string;
  form!: UntypedFormGroup;
  OnChange = (value) => { };
  OnTouched = () => { };
  updateValueOnChange$: Observable<void> = new Observable<void>();
  updateAuthConfig$: Observable<void>;
  PropertyType = PropertyType;
  optionsObservables$: {
    [key: ConfigKey]: Observable<DropdownState<any>>;
  } = {};
  dropdownsLoadingFlags$: { [key: ConfigKey]: Observable<boolean> } = {};
  allAuthConfigs$: Observable<DropdownItem[]>;
  updateOrAddConnectionDialogClosed$: Observable<void>;
  configDropdownChanged$: Observable<any>;
  cloudAuthCheck$: Observable<void>;
  constructor(
    private fb: UntypedFormBuilder,
    public themeService: ThemeService,
    private actionMetaDataService: ActionMetaService,
    private dialogService: MatDialog,
    private store: Store,
    private cloudAuthConfigsService: CloudAuthConfigsService,
    private authenticationService: AuthenticationService,
    private codeService: CodeService
  ) {
    this.allAuthConfigs$ = this.store.select(
      BuilderSelectors.selectAppConnectionsDropdownOptions
    );
  }

  writeValue(obj: PieceConfig[]): void {
    this.configs = obj;
    this.createForm();
  }
  registerOnChange(fn: any): void {
    this.OnChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.OnTouched = fn;
  }
  setDisabledState(disabled: boolean) {
    if (disabled) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }
  validate() {
    if (this.form.invalid) {
      return { invalid: true };
    }
    return null;
  }
  createForm() {
    this.requiredConfigs = this.configs.filter((c) => c.required);
    this.allOptionalConfigs = this.configs.filter((c) => !c.required);

    this.selectedOptionalConfigs = this.allOptionalConfigs.filter(
      (c) => c.value !== undefined
    );
    const requiredConfigsControls = this.createConfigsFormControls(
      this.requiredConfigs
    );
    const optionalConfigsControls = this.createConfigsFormControls(
      this.selectedOptionalConfigs
    );
    this.form = this.fb.group({
      ...requiredConfigsControls,
      ...optionalConfigsControls,
    });
    this.createDropdownConfigsObservables();
    this.updateValueOnChange$ = this.form.valueChanges.pipe(
      tap((value) => {
        this.OnChange(this.formValueMiddleWare(value));
      }),
      map(() => void 0)
    );

    this.form.markAllAsTouched();
  }

  createDropdownConfigsObservables() {
    this.configs.forEach((c) => {
      if (c.type === PropertyType.DROPDOWN) {
        const refreshers$ = {};
        c.refreshers!.forEach((r) => {
          refreshers$[r] = this.form.controls[r].valueChanges.pipe(
            distinctUntilChanged((prev, curr) => {
              return JSON.stringify(prev) === JSON.stringify(curr);
            }),
            startWith(this.configs.find((c) => c.key === r)!.value),
            debounceTime(150)
          );
        });
        if (c.refreshers!.length === 0) {
          refreshers$['oneTimeRefresh'] = of(true);
        }
        this.optionsObservables$[c.key] = combineLatest(refreshers$).pipe(
          switchMap((res) => {
            return this.store
              .select(BuilderSelectors.selectCurrentCollection)
              .pipe(
                take(1),
                switchMap((collection) => {
                  return this.actionMetaDataService.getPieceActionConfigOptions(
                    {
                      propertyName: c.key,
                      stepName: this.stepName,
                      input: res,
                      collectionVersionId: collection.version!.id,
                    },
                    this.pieceName
                  );
                })
              );
          }),
          shareReplay(1),
          catchError((err) => {
            console.error(err);
            return of({
              options: [],
              disabled: true,
              placeholder: 'unknown server erro happend, check console',
            });
          })
        );
        this.dropdownsLoadingFlags$[c.key] = this.optionsObservables$[
          c.key
        ].pipe(
          startWith(null),
          map((val) => {
            if (val === null) return true;
            if (!Array.isArray(val.options)) {
              console.error(
                `Activepieces- Config ${c.label} options are not returned in array form--> ${val}`
              );
            }
            return false;
          })
        );
      }
    });
  }

  private createConfigsFormControls(configs: PieceConfig[]) {
    const controls: { [key: string]: UntypedFormControl } = {};
    configs.forEach((c) => {
      const validators: ValidatorFn[] = [];
      if (c.required) {
        validators.push(Validators.required);
      }
      if (c.type === PropertyType.OBJECT) {
        controls[c.key] = new UntypedFormControl(c.value || {}, validators);
      } else if (c.type === PropertyType.ARRAY) {
        controls[c.key] = new UntypedFormControl(c.value || [''], validators);
      } else if (c.type === PropertyType.JSON) {
        validators.push(jsonValidator);
        if (typeof c.value === "object") {
          controls[c.key] = new UntypedFormControl(JSON.stringify(c.value), validators);
        }
        else {
          controls[c.key] = new UntypedFormControl(c.value || "{}", validators);
        }
      }
      else {
        controls[c.key] = new UntypedFormControl(c.value, validators);
      }

    });
    return controls;
  }
  getControl(configKey: string) {
    return this.form.get(configKey);
  }

  removeConfig(config: PieceConfig) {
    this.form.removeControl(config.key);
    const configIndex = this.allOptionalConfigs.findIndex((c) => c === config);
    this.selectedOptionalConfigs.splice(configIndex, 1);
  }

  addOptionalConfig(config: PieceConfig) {
    this.form.addControl(config.key, new UntypedFormControl());
    this.selectedOptionalConfigs.push(config);
  }

  newConnectionDialogProcess(
    pieceConfigName: string,
    pieceConfigType: PropertyType.OAUTH2 | PropertyType.SECRET_TEXT
  ) {
    if (pieceConfigType === PropertyType.OAUTH2) {
      this.newOAuth2AuthenticationDialogProcess(pieceConfigName);
    } else {
      this.openNewSecretKeyConnection(pieceConfigName);
    }
  }
  private openNewSecretKeyConnection(pieceConfigName: string) {
    const authConfig = this.configs.find((c) => c.key === pieceConfigName)!;
    const dialogData: SecretTextConnectionDialogData = {
      pieceName: this.pieceName,
      displayName: authConfig.label,
      description: authConfig.description || '',
    };
    this.updateOrAddConnectionDialogClosed$ = this.dialogService
      .open(SecretTextConnectionDialogComponent, {
        data: dialogData,
      })
      .afterClosed()
      .pipe(
        tap((result: AppConnection | null) => {
          if (result) {
            const authConfigOptionValue = `\${connections.${result.name}}`;
            this.form.get(pieceConfigName)!.setValue(authConfigOptionValue);
          }
        }),
        map(() => void 0)
      );
  }

  newOAuth2AuthenticationDialogProcess(pieceConfigName: string) {
    if (!this.checkingOAuth2CloudManager) {
      this.checkingOAuth2CloudManager = true;
      this.cloudAuthCheck$ = this.cloudAuthConfigsService
        .getAppsAndTheirClientIds()
        .pipe(
          catchError((err) => {
            console.error(err);
            return of({});
          }),
          tap(() => {
            this.checkingOAuth2CloudManager = false;
          }),
          map((res) => {
            return res[this.pieceName];
          }),
          tap((cloudAuth2Config: { clientId: string }) => {
            if (cloudAuth2Config) {
              this.openNewCloudOAuth2ConnectionModal(
                pieceConfigName,
                cloudAuth2Config.clientId
              );
            } else {
              this.openNewOAuth2ConnectionDialog(pieceConfigName);
            }
          }),
          map(() => void 0)
        );
    }
  }
  openNewOAuth2ConnectionDialog(authConfigName: string) {
    this.updateOrAddConnectionDialogClosed$ = this.authenticationService
      .getFrontendUrl()
      .pipe(
        switchMap((serverUrl) => {
          return this.dialogService
            .open(OAuth2ConnectionDialogComponent, {
              data: {
                pieceAuthConfig: this.configs.find(
                  (c) => c.type === PropertyType.OAUTH2
                ),
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
                  this.checkingOAuth2CloudManager = true;
                  this.cloudAuthCheck$ = this.cloudAuthConfigsService
                    .getAppsAndTheirClientIds()
                    .pipe(
                      catchError((err) => {
                        console.error(err);
                        return of({});
                      }),
                      tap(() => {
                        this.checkingOAuth2CloudManager = false;
                      }),
                      map((res) => {
                        return res[this.pieceName];
                      }),
                      tap((cloudAuth2Config: { clientId: string }) => {
                        this.openNewCloudOAuth2ConnectionModal(
                          authConfigName,
                          cloudAuth2Config.clientId
                        );
                      }),
                      map(() => void 0)
                    );
                } else if (typeof result === 'object') {
                  const authConfigOptionValue = `\${connections.${result.name}}`;
                  this.form
                    .get(authConfigName)!
                    .setValue(authConfigOptionValue);
                }
              }),
              map(() => void 0)
            );
        })
      );
  }

  openNewCloudOAuth2ConnectionModal(authConfigKey: string, clientId: string) {
    this.updateOrAddConnectionDialogClosed$ = this.dialogService
      .open(CloudOAuth2ConnectionDialogComponent, {
        data: {
          pieceAuthConfig: this.configs.find(
            (c) => c.type === PropertyType.OAUTH2
          ),
          pieceName: this.pieceName,
          clientId: clientId,
        },
      })
      .afterClosed()
      .pipe(
        tap((result: AppConnection | string) => {
          if (typeof result === 'object') {
            const authConfigOptionValue = `\${connections.${result.name}}`;
            this.form.get(authConfigKey)!.setValue(authConfigOptionValue);
          } else if (result === USE_MY_OWN_CREDENTIALS) {
            this.openNewOAuth2ConnectionDialog(authConfigKey);
          }
        }),
        map(() => void 0)
      );
  }
  editSelectedAuthConfig(authConfigKey: string, pieceConfigType: PropertyType.OAUTH2 | PropertyType.SECRET_TEXT) {
    const selectedValue: any = this.form.get(authConfigKey)!.value;
    const allConnections$ = this.store.select(
      BuilderSelectors.selectAllAppConnections
    );
    const currentConnection$ = allConnections$.pipe(
      take(1),
      map((connections) => {
        const connection = connections.find(
          (c) =>
            selectedValue &&
            c.name ===
            this.getConnectionNameFromInterpolatedString(selectedValue)
        );
        return connection;
      }));
    if (pieceConfigType === PropertyType.OAUTH2) {
      this.updateAuthConfig$ = currentConnection$.pipe(
        tap((connection) => {
          if (connection) {
            if (connection.value.type === AppConnectionType.OAUTH2) {
              this.updateOrAddConnectionDialogClosed$ = this.dialogService
                .open(OAuth2ConnectionDialogComponent, {
                  data: {
                    connectionToUpdate: connection,
                    pieceAuthConfig: this.configs.find(
                      (c) => c.type === PropertyType.OAUTH2
                    ),
                    pieceName: this.pieceName,
                  },
                })
                .afterClosed()
                .pipe(map(() => void 0));
            } else {
              if (!this.checkingOAuth2CloudManager) {
                this.checkingOAuth2CloudManager = true;
                this.updateOrAddConnectionDialogClosed$ =
                  this.cloudAuthConfigsService.getAppsAndTheirClientIds().pipe(
                    tap(() => {
                      this.checkingOAuth2CloudManager = false;
                    }),
                    switchMap((res) => {
                      const clientId = res[this.pieceName].clientId;
                      return this.dialogService
                        .open(CloudOAuth2ConnectionDialogComponent, {
                          data: {
                            connectionToUpdate: connection,
                            pieceAuthConfig: this.configs.find(
                              (c) => c.type === PropertyType.OAUTH2
                            ),
                            pieceName: this.pieceName,
                            clientId: clientId,
                          },
                        })
                        .afterClosed()
                        .pipe(map(() => void 0));
                    })
                  );
              }
            }
          }
        }),
        map(() => void 0)
      );
    }
    else {
      this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(switchMap(connection => {
        const secretKeyConnection = connection as ApiKeyAppConnection;
        const authConfig = this.configs.find((c) => c.key === authConfigKey)!;
        const dialogData: SecretTextConnectionDialogData = {
          pieceName: this.pieceName,
          displayName: authConfig.label,
          description: authConfig.description || '',
          connectionName: connection!.name,
          secretText: secretKeyConnection!.value.secret_text
        };
        return this.dialogService
          .open(SecretTextConnectionDialogComponent, {
            data: dialogData,
          })
          .afterClosed()
      }))
    }

  }

  dropdownCompareWithFunction = (opt: string, formControlValue: string) => {
    return formControlValue !== undefined && deepEqual(opt, formControlValue);
  };

  getConnectionNameFromInterpolatedString(interpolatedString: string) {
    //eg. ${connections.google}
    const result = interpolatedString.split('${connections.')[1];
    return result.slice(0, result.length - 1);
  }
  addMentionToJsonControl(jsonControl: CodemirrorComponent, mention: InsertMentionOperation) {
    var doc = jsonControl.codeMirror!.getDoc();
    var cursor = doc.getCursor();
    doc.replaceRange(mention.insert.mention.serverValue, cursor);
  }

  formValueMiddleWare(formValue: object) {
    const formattedValue = { ...formValue };
    Object.keys(formValue).forEach(configKey => {
      if (this.configs.find(c => c.key === configKey)!.type === PropertyType.JSON) {
        try {
          formattedValue[configKey] = JSON.parse(formValue[configKey]);
        } catch (_) { }
      }
    });
    return formattedValue;
  }

  beautify(configKey: string) {
    try {
      const ctrl = this.form.get(configKey)!;
      ctrl.setValue(this.codeService.beautifyJson(JSON.parse(ctrl.value)));
    } catch { }
  }
}
