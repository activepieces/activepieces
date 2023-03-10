import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  QueryList,
  ViewChildren,
} from '@angular/core';
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
  BehaviorSubject,
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
} from '../../../flow-builder/service/action-meta.service';
import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { ThemeService } from '../../service/theme.service';
import {
  PieceConfig,
  PieceProperty,
  propsConvertor,
} from './connector-action-or-config';
import { DropdownItem } from '../../model/dropdown-item.interface';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { BuilderSelectors } from '../../../flow-builder/store/builder/builder.selector';
import deepEqual from 'deep-equal';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { InsertMentionOperation } from '../form-controls/interpolating-text-form-control/utils';
import { jsonValidator } from '../../validators/json-validator';
import { CodeService } from '../../../flow-builder/service/code.service';
import { PropertyType } from '@activepieces/shared';
import { InterpolatingTextFormControlComponent } from '../form-controls/interpolating-text-form-control/interpolating-text-form-control.component';

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
  updateValueOnChange$: Observable<void> = new Observable<void>();
  PropertyType = PropertyType;
  dropdownOptionsObservables$: {
    [key: ConfigKey]: Observable<DropdownState<unknown>>;
  } = {};
  dynamicPropsObservables$: {
    [key: ConfigKey]: Observable<PieceConfig[]>;
  } = {};
  refreshableConfigsLoadingFlags$: {
    [key: ConfigKey]: BehaviorSubject<boolean>;
  } = {};

  allAuthConfigs$: Observable<DropdownItem[]>;
  configDropdownChanged$: Observable<unknown>;
  cloudAuthCheck$: Observable<void>;
  editorOptions = {
    lineNumbers: true,
    theme: 'lucario',
    lineWrapping: true,
    matchBrackets: true,
    gutters: ['CodeMirror-lint-markers'],
    mode: 'application/json',
    lint: true,
  };
  customizedInputs: Record<string, boolean> | undefined;
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
  @ViewChildren('textControl', { read: ElementRef })
  theInputs: QueryList<ElementRef>;
  form!: UntypedFormGroup;
  OnChange: (value) => void;
  OnTouched: () => void;

  constructor(
    private fb: UntypedFormBuilder,
    public themeService: ThemeService,
    private actionMetaDataService: ActionMetaService,
    private store: Store,
    private codeService: CodeService,
    private cd: ChangeDetectorRef
  ) {
    this.allAuthConfigs$ = this.store.select(
      BuilderSelectors.selectAppConnectionsDropdownOptions
    );
  }

  writeValue(
    obj:
      | { configs: PieceConfig[]; customizedInputs: Record<string, boolean> }
      | PieceConfig[]
  ): void {
    if (Array.isArray(obj)) {
      this.configs = obj;
    } else {
      this.configs = obj.configs;
      this.customizedInputs = obj.customizedInputs;
    }
    this.createForm();
    this.cd.markForCheck();
  }
  registerOnChange(fn: (value) => void): void {
    this.OnChange = fn;
  }
  registerOnTouched(fn: () => void): void {
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
    this.createDynamicConfigsObservables();
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
      if (
        c.type === PropertyType.DROPDOWN ||
        c.type === PropertyType.MULTI_SELECT_DROPDOWN
      ) {
        this.dropdownOptionsObservables$[c.key] =
          this.createRefreshableConfigObservables<DropdownState<unknown>>(
            c
          ).pipe(
            catchError(() => {
              return of({
                options: [],
                disabled: true,
                placeholder: 'unknown server erro happend, check console',
              });
            })
          );
      }
    });
  }
  createDynamicConfigsObservables() {
    this.configs.forEach((parentConfig) => {
      if (parentConfig.type === PropertyType.DYNAMIC) {
        this.dynamicPropsObservables$[parentConfig.key] =
          this.createRefreshableConfigObservables<
            Record<string, PieceProperty>
          >(parentConfig).pipe(
            map((res) => {
              return Object.entries(res).map(([name, prop]) => {
                return propsConvertor.convertToFrontEndConfig(name, prop);
              });
            }),
            tap((res) => {
              const fg = this.form.get(parentConfig.key) as UntypedFormGroup;
              if (fg) {
                const removedControlsKeys = Object.keys(fg.controls).filter(
                  (key) => res.find((c) => c.key === key) === undefined
                );
                removedControlsKeys.forEach((removedKey) => {
                  fg.removeControl(removedKey);
                });
                res.forEach((childConfig) => {
                  const childConfigControl = fg.get(childConfig.key);
                  if (childConfigControl) {
                    if (childConfig.required) {
                      childConfigControl.addValidators(Validators.required);
                    } else {
                      childConfigControl.removeValidators(Validators.required);
                    }
                  } else {
                    fg.addControl(
                      childConfig.key,
                      new UntypedFormControl(
                        childConfig.defaultValue,
                        childConfig.required ? Validators.required : []
                      ),
                      { emitEvent: false }
                    );
                  }
                });
                fg.markAllAsTouched();
              }
            }),
            shareReplay(1)
          );
      }
    });
  }

  createRefreshableConfigObservables<
    T extends DropdownState<unknown> | Record<string, PieceProperty>
  >(c: PieceConfig) {
    this.refreshableConfigsLoadingFlags$[c.key] = new BehaviorSubject(true);
    const refreshers$ = {};
    c.refreshers!.forEach((r) => {
      refreshers$[r] = this.form.controls[r].valueChanges.pipe(
        distinctUntilChanged((prev, curr) => {
          return JSON.stringify(prev) === JSON.stringify(curr);
        }),
        startWith(this.configs.find((c) => c.key === r)!.value),
        tap(() => {
          this.refreshableConfigsLoadingFlags$[c.key].next(true);
        }),
        debounceTime(150)
      );
    });
    if (c.refreshers!.length === 0) {
      refreshers$['oneTimeRefresh'] = of(true);
    }
    return combineLatest(refreshers$).pipe(
      switchMap((res) => {
        return this.store.select(BuilderSelectors.selectCurrentCollection).pipe(
          take(1),
          switchMap((collection) => {
            return this.actionMetaDataService.getPieceActionConfigOptions<T>(
              {
                pieceVersion: '0.0.0',
                propertyName: c.key,
                stepName: this.stepName,
                input: res,
                collectionId: collection.id,
              },
              this.pieceName
            );
          })
        );
      }),
      catchError((err) => {
        console.error(err);
        throw err;
      }),
      tap(() => {
        this.refreshableConfigsLoadingFlags$[c.key].next(false);
      }),
      shareReplay(1)
    );
  }

  private createConfigsFormControls(configs: PieceConfig[]) {
    const controls: { [key: string]: UntypedFormControl | UntypedFormGroup } =
      {};

    configs.forEach((c) => {
      const validators: ValidatorFn[] = [];
      if (
        c.required &&
        c.type !== PropertyType.OBJECT &&
        c.type !== PropertyType.ARRAY
      ) {
        validators.push(Validators.required);
      }
      if (c.type === PropertyType.OBJECT) {
        controls[c.key] = new UntypedFormControl(
          c.value || c.defaultValue || {},
          validators
        );
      } else if (c.type === PropertyType.ARRAY) {
        controls[c.key] = new UntypedFormControl(
          c.value || c.defaultValue || [''],
          validators
        );
      } else if (c.type === PropertyType.JSON) {
        if (!this.customizedInputs || !this.customizedInputs[c.key]) {
          validators.push(jsonValidator);
        }
        if (typeof c.value === 'object') {
          controls[c.key] = new UntypedFormControl(
            JSON.stringify(c.value || c.defaultValue),
            validators
          );
        } else {
          controls[c.key] = new UntypedFormControl(
            c.value || JSON.stringify(c.defaultValue ?? {}, null, 2),
            validators
          );
        }
      } else if (c.type === PropertyType.DYNAMIC) {
        const dynamicConfigControls = {};
        if (c.value) {
          Object.keys(c.value).forEach((k) => {
            dynamicConfigControls[k] = new UntypedFormControl(
              (c.value as object)[k]
            );
          });
        } else {
          controls[c.key] = new UntypedFormControl(
            c.value || c.defaultValue || '{}',
            validators
          );
        }
        controls[c.key] = this.fb.group(dynamicConfigControls);
      } else {
        controls[c.key] = new UntypedFormControl(
          c.value === undefined || null ? c.defaultValue : c.value,
          validators
        );
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

  connectionValueChanged(event: {
    configKey: string;
    value: `\${connections.${string}}`;
  }) {
    this.form.get(event.configKey)!.setValue(event.value);
  }
  dropdownCompareWithFunction = (opt: string, formControlValue: string) => {
    return formControlValue !== undefined && deepEqual(opt, formControlValue);
  };

  addMentionToJsonControl(
    jsonControl: CodemirrorComponent,
    mention: InsertMentionOperation
  ) {
    const doc = jsonControl.codeMirror!.getDoc();
    const cursor = doc.getCursor();
    doc.replaceRange(mention.insert.mention.serverValue, cursor);
  }

  formValueMiddleWare(formValue: object) {
    const formattedValue = { ...formValue };

    Object.keys(formValue).forEach((configKey) => {
      if (
        this.configs.find((c) => c.key === configKey)!.type ===
        PropertyType.JSON
      ) {
        try {
          formattedValue[configKey] = JSON.parse(formValue[configKey]);
        } catch (_) {
          //incase it is an invalid json
        }
      }
    });

    if (this.customizedInputs) {
      return {
        input: formattedValue,
        customizedInputs: this.customizedInputs,
      };
    } else {
      return formattedValue;
    }
  }

  beautify(configKey: string) {
    try {
      const ctrl = this.form.get(configKey)!;
      ctrl.setValue(this.codeService.beautifyJson(JSON.parse(ctrl.value)));
    } catch {
      //ignore
    }
  }
  toggleCustomizedInputFlag(configKey: string) {
    if (!this.customizedInputs) {
      throw new Error('Activepieces-customized inputs map is not initialized');
    }
    const isCustomized = !this.customizedInputs[configKey];
    this.customizedInputs = {
      ...this.customizedInputs,
      [configKey]: isCustomized,
    };
    const config = this.configs.find((c) => c.key === configKey);
    const ctrl = this.form.get(configKey);
    if (!config || !ctrl) {
      throw new Error('Activepieces-config not found: ' + configKey);
    }

    const silentChange = { emitEvent: false };
    switch (config.type) {
      case PropertyType.JSON: {
        if (isCustomized) {
          ctrl.removeValidators([jsonValidator]);
          ctrl.setValue('', silentChange);
        } else {
          ctrl.addValidators([jsonValidator]);
          ctrl.setValue('{}', silentChange);
        }
        break;
      }
      case PropertyType.OBJECT: {
        if (isCustomized) {
          ctrl.setValue('', silentChange);
        } else {
          ctrl.setValue({}, silentChange);
        }
        break;
      }
      case PropertyType.ARRAY: {
        if (isCustomized) {
          ctrl.setValue('', silentChange);
        } else {
          ctrl.setValue([''], silentChange);
        }
        break;
      }
      default: {
        ctrl.setValue(undefined, silentChange);
      }
    }
    this.cd.detectChanges();
    const input = this.theInputs.find(
      (input) => input.nativeElement.getAttribute('name') === configKey
    );
    if (input) {
      this.cd.detectChanges();
      input.nativeElement.click();
    }
  }
  async addMention(
    textControl: InterpolatingTextFormControlComponent,
    mentionOp: InsertMentionOperation
  ) {
    await textControl.addMention(mentionOp);
  }
}
