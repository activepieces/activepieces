import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
  FormControl,
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
  take,
  forkJoin,
  switchMap,
  tap,
} from 'rxjs';
import deepEqual from 'deep-equal';
import {
  DropdownProperty,
  DropdownState,
  DynamicProperties,
  MultiSelectDropdownProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  jsonValidator,
  fadeInUp400ms,
  InsertMentionOperation,
  FlagService,
  appConnectionsSelectors,
  EMPTY_SPACE_BETWEEN_INPUTS_IN_PIECE_PROPERTIES_FORM,
  BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM,
} from '@activepieces/ui/common';
import {
  BuilderSelectors,
  CodeService,
  ConnectionDropdownItem,
} from '@activepieces/ui/feature-builder-store';

import { InterpolatingTextFormControlComponent } from '../interpolating-text-form-control/interpolating-text-form-control.component';
import { PiecePropertiesFormValue } from '../models/piece-properties-form-value';
import { AddEditConnectionButtonComponent } from '@activepieces/ui/feature-connections';
import { PackageType, PieceType } from '@activepieces/shared';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { createConfigsFormControls } from '../shared';

type ConfigKey = string;

@Component({
  selector: 'app-piece-properties-form',
  templateUrl: './piece-properties-form.component.html',
  styleUrls: ['./piece-properties-form.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: PiecePropertiesFormComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: PiecePropertiesFormComponent,
    },
  ],
  animations: [fadeInUp400ms],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiecePropertiesFormComponent implements ControlValueAccessor {
  readonly BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM =
    BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM;
  readonly MIN_SPACING_BETWEEN_INPUTS =
    EMPTY_SPACE_BETWEEN_INPUTS_IN_PIECE_PROPERTIES_FORM;
  updateValueOnChange$: Observable<void> = new Observable<void>();
  PropertyType = PropertyType;
  searchControls: Record<string, FormControl> = {};
  dropdownOptionsObservables$: {
    [key: ConfigKey]: Observable<DropdownState<unknown>>;
  } = {};
  dynamicPropsObservables$: {
    [key: ConfigKey]: Observable<PiecePropertyMap>;
  } = {};
  refreshableConfigsLoadingFlags$: {
    [key: ConfigKey]: BehaviorSubject<boolean>;
  } = {};
  descriptionOverflownMap: Record<string, boolean> = {};
  descriptionExpandedMap: Record<string, boolean> = {};
  allAuthConfigs$: Observable<ConnectionDropdownItem[]>;
  configDropdownChanged$: Observable<unknown>;
  cloudAuthCheck$: Observable<void>;
  codeEditorOptions = {
    minimap: { enabled: false },
    theme: 'cobalt2',
    language: 'json',
    readOnly: false,
    automaticLayout: true,
    contextmenu: false,
    formatOnPaste: false,
    formatOnType: false,
  };
  customizedInputs: Record<string, boolean> | undefined;
  checkingOAuth2CloudManager = false;
  properties: PiecePropertyMap = {};
  requiredProperties: PiecePropertyMap = {};
  optionalProperties: PiecePropertyMap = {};
  optionalConfigsMenuOpened = false;
  @Input({ required: true }) actionOrTriggerName: string;
  @Input({ required: true }) packageType: PackageType;
  @Input({ required: true }) pieceType: PieceType;
  @Input({ required: true }) pieceName: string;
  @Input({ required: true }) pieceVersion: string;
  @Input({ required: true }) pieceDisplayName: string;
  @Input({ required: true }) isTriggerPieceForm = false;
  @ViewChildren('textControl', { read: ElementRef })
  theInputs: QueryList<ElementRef>;
  @ViewChild('addConnectionBtn')
  addConnectionBtn: AddEditConnectionButtonComponent;
  form!: UntypedFormGroup;
  setDefaultValue$: Observable<null>;
  OnChange: (value: unknown) => void;
  OnTouched: () => void;
  staticDropdownSearchControl = new FormControl('', { nonNullable: true });
  jsonMonacoEditor: any;
  constructor(
    private fb: UntypedFormBuilder,
    private actionMetaDataService: PieceMetadataService,
    private store: Store,
    private flagService: FlagService,
    private codeService: CodeService,
    private cd: ChangeDetectorRef
  ) {
    this.allAuthConfigs$ = this.store.select(
      appConnectionsSelectors.selectAppConnectionsDropdownOptions
    );
  }
  writeValue(obj: PiecePropertiesFormValue): void {
    this.properties = obj.properties;
    this.customizedInputs = obj.customizedInputs;
    this.descriptionExpandedMap = {};
    this.descriptionOverflownMap = {};
    this.searchControls = {};
    Object.keys(this.properties).forEach((pk) => {
      this.searchControls[pk] = new FormControl('');
    });
    this.createForm(obj.propertiesValues);
    if (obj.setDefaultValues) {
      this.setDefaultValue$ = of(null).pipe(
        tap(() => {
          this.form.setValue(this.form.value);
        })
      );
    }
    this.cd.markForCheck();
  }
  registerOnChange(fn: (value: unknown) => void): void {
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
  createForm(propertiesValues: Record<string, unknown>) {
    this.requiredProperties = {};
    this.optionalProperties = {};
    Object.entries(this.properties).forEach(([pk]) => {
      this.properties[pk].required ||
      this.properties[pk].type === PropertyType.MARKDOWN
        ? (this.requiredProperties[pk] = this.properties[pk])
        : (this.optionalProperties[pk] = this.properties[pk]);
    });

    const requiredConfigsControls = createConfigsFormControls(
      this.requiredProperties,
      propertiesValues,
      this.fb,
      this.customizedInputs
    );
    const optionalConfigsControls = createConfigsFormControls(
      this.optionalProperties,
      propertiesValues,
      this.fb,
      this.customizedInputs
    );

    this.form = this.fb.group({
      ...requiredConfigsControls,
      ...optionalConfigsControls,
    });

    this.createDropdownConfigsObservables(this.properties);
    this.createDynamicConfigsObservables(this.properties);
    this.updateValueOnChange$ = this.form.valueChanges.pipe(
      tap((value) => {
        this.OnChange(this.formValueMiddleWare(value));
      }),
      map(() => void 0)
    );

    this.form.markAllAsTouched();
  }
  addNewConnectionButtonPress() {
    this.addConnectionBtn.buttonClicked();
  }
  createDropdownConfigsObservables(properties: PiecePropertyMap) {
    Object.keys(properties).forEach((pk) => {
      const property = properties[pk];
      if (
        property.type === PropertyType.DROPDOWN ||
        property.type === PropertyType.MULTI_SELECT_DROPDOWN
      ) {
        this.dropdownOptionsObservables$[pk] =
          this.createRefreshableConfigObservables<DropdownState<unknown>>(
            {
              property: property,
              propertyKey: pk,
            },
            {
              options: [],
              disabled: true,
              placeholder:
                'An unexpected error occured please contact our support',
            }
          ).pipe(
            map((res) => {
              if (res.options.length === 0) {
                const emptyDropdownState: DropdownState<unknown> = {
                  options: [],
                  disabled: true,
                  placeholder:
                    res.placeholder ?? `No ${property.displayName} Available`,
                };
                return emptyDropdownState;
              }
              return res;
            }),
            catchError((err) => {
              console.error(err);
              return of({
                options: [],
                disabled: true,
                placeholder: 'unknown server error happend, check console',
              });
            }),
            shareReplay(1)
          );
      }
    });
  }
  createDynamicConfigsObservables(properties: PiecePropertyMap) {
    Object.keys(properties).forEach((pk) => {
      const parentProperty = properties[pk];
      if (parentProperty.type == PropertyType.DYNAMIC) {
        this.dynamicPropsObservables$[pk] =
          this.createRefreshableConfigObservables<PiecePropertyMap>(
            {
              property: parentProperty,
              propertyKey: pk,
            },
            {}
          ).pipe(
            tap((res) => {
              const fg = this.form.get(pk) as UntypedFormGroup;
              if (fg) {
                const removedControlsKeys = Object.keys(fg.controls).filter(
                  (key) => res[key] === undefined
                );
                removedControlsKeys.forEach((removedKey) => {
                  fg.removeControl(removedKey);
                });
                Object.keys(res).forEach((ck) => {
                  const childConfigControl = fg.get(ck);
                  if (childConfigControl) {
                    if (res[ck].required) {
                      childConfigControl.addValidators(Validators.required);
                    } else {
                      childConfigControl.removeValidators(Validators.required);
                    }
                  } else {
                    fg.addControl(
                      ck,
                      new UntypedFormControl(
                        res[ck].defaultValue,
                        res[ck].required ? Validators.required : []
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
    T extends DropdownState<unknown> | PiecePropertyMap
  >(
    obj: {
      property:
        | DynamicProperties<boolean>
        | MultiSelectDropdownProperty<unknown, boolean>
        | DropdownProperty<unknown, boolean>;
      propertyKey: string;
    },
    fallbackObject: T
  ) {
    this.refreshableConfigsLoadingFlags$[obj.propertyKey] = new BehaviorSubject(
      true
    );
    const authTypes = [
      PropertyType.OAUTH2,
      PropertyType.CUSTOM_AUTH,
      PropertyType.SECRET_TEXT,
      PropertyType.BASIC_AUTH,
    ];
    const refreshers$: Record<string, Observable<unknown>> = {};
    Object.keys(this.properties).forEach((rk) => {
      const isAuthProperty = authTypes.includes(this.properties[rk].type);
      const inRefreshers = obj.property.refreshers.includes(rk);
      if (!isAuthProperty && !inRefreshers) {
        return;
      }
      refreshers$[rk] = this.form.controls[rk].valueChanges.pipe(
        distinctUntilChanged((prev, curr) => {
          if (isAuthProperty) {
            return false;
          }
          return JSON.stringify(prev) === JSON.stringify(curr);
        }),
        tap(() => {
          if (obj.property.type !== PropertyType.DYNAMIC) {
            this.form.controls[obj.propertyKey].setValue(undefined);
          }
        }),
        startWith(this.form.controls[rk].value),
        debounceTime(150)
      );
    });
    if (obj.property.refreshers.length === 0) {
      refreshers$['oneTimeRefresh'] = of(true);
    }
    //Add search control as a refresher as well
    if (
      obj.property.type === PropertyType.DROPDOWN &&
      obj.property.refreshOnSearch
    ) {
      refreshers$[obj.propertyKey] = this.searchControls[
        obj.propertyKey
      ].valueChanges.pipe(
        debounceTime(150),
        distinctUntilChanged(),
        startWith(this.searchControls[obj.propertyKey].value)
      );
    }
    return this.store.select(BuilderSelectors.selectCurrentFlow).pipe(
      take(1),
      switchMap((flowVersion) =>
        combineLatest(refreshers$).pipe(
          tap(() => {
            this.refreshableConfigsLoadingFlags$[obj.propertyKey].next(true);
          }),
          switchMap((res) =>
            this.actionMetaDataService
              .getPieceActionConfigOptions<T>({
                packageType: this.packageType,
                pieceType: this.pieceType,
                pieceVersion: this.pieceVersion,
                pieceName: this.pieceName,
                propertyName: obj.propertyKey,
                stepName: this.actionOrTriggerName,
                flowId: flowVersion.id,
                flowVersionId: flowVersion.version.id,
                input: res,
                searchValue: this.searchControls[obj.propertyKey].value,
              })
              .pipe(
                catchError((err) => {
                  console.error(err);
                  return of(fallbackObject);
                })
              )
          ),
          tap(() => {
            this.refreshableConfigsLoadingFlags$[obj.propertyKey].next(false);
          }),
          shareReplay(1)
        )
      )
    );
  }

  connectionValueChanged(event: {
    propertyKey: string;
    value: `{{connections['${string}']}}`;
  }) {
    this.form.get(event.propertyKey)!.setValue(event.value.toString());
  }
  dropdownCompareWithFunction = (opt: string, formControlValue: string) => {
    return formControlValue !== undefined && deepEqual(opt, formControlValue);
  };

  addMentionToJsonControl(mention: InsertMentionOperation) {
    this.jsonMonacoEditor.trigger('keyboard', 'type', {
      text: mention.insert.apMention.serverValue,
    });
  }
  onInit(monacoEditor: any) {
    this.jsonMonacoEditor = monacoEditor;
  }
  formValueMiddleWare(formValue: Record<string, unknown>) {
    const formattedValue: Record<string, unknown> = { ...formValue };
    Object.keys(formValue).forEach((pk) => {
      const property = this.properties[pk];
      if (property.type === PropertyType.DYNAMIC) {
        const dynamicPropertyValue = formValue[pk] as Record<string, unknown>;
        Object.keys(dynamicPropertyValue).forEach((dpk) => {
          if (
            dynamicPropertyValue[dpk] === '' ||
            dynamicPropertyValue[dpk] === null
          ) {
            (formattedValue[pk] as Record<string, unknown>)[dpk] = undefined;
          }
        });
      }
      if (formattedValue[pk] === '' || formattedValue[pk] === null) {
        formattedValue[pk] = undefined;
      } else {
        if (property.type === PropertyType.JSON) {
          try {
            formattedValue[pk] = JSON.parse(formValue[pk] as string);
          } catch (_) {
            //incase it is an invalid json
          }
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
  toggleCustomizedInputFlag(propertyKey: string) {
    if (!this.customizedInputs) {
      throw new Error('Activepieces-customized inputs map is not initialized');
    }
    const isCustomized = !this.customizedInputs[propertyKey];
    this.customizedInputs = {
      ...this.customizedInputs,
      [propertyKey]: isCustomized,
    };
    const property = this.properties[propertyKey];
    const ctrl = this.form.get(propertyKey);
    if (!property || !ctrl) {
      throw new Error('Activepieces-config not found: ' + propertyKey);
    }

    const silentChange = { emitEvent: false };
    switch (property.type) {
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
          if (property.properties) {
            ctrl.setValue([{}], silentChange);
          } else {
            ctrl.setValue([''], silentChange);
          }
        }
        break;
      }
      default: {
        ctrl.setValue(undefined, silentChange);
      }
    }
    this.cd.markForCheck();
    const input = this.theInputs.find(
      (input) => input.nativeElement.getAttribute('name') === propertyKey
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
  checkIfTheDivIsTheTarget($event: MouseEvent, noConnectionDiv: HTMLElement) {
    return $event.target === noConnectionDiv;
  }

  convertMarkdown(markdown: string): Observable<string> {
    return forkJoin({
      flow: this.store.select(BuilderSelectors.selectCurrentFlow).pipe(take(1)),
      webhookPrefix: this.flagService.getWebhookUrlPrefix(),
      formsPrefix: this.flagService.getFormUrlPrefix(),
    }).pipe(
      map((res) => {
        return markdown
          .replace('{{webhookUrl}}', `${res.webhookPrefix}/${res.flow.id}`)
          .replace('{{formUrl}}', `${res.formsPrefix}/${res.flow.id}`);
      })
    );
  }
}
