import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';

import {
  forkJoin,
  map,
  Observable,
  of,
  pairwise,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import {
  ActionErrorHandlingOptions,
  ActionType,
  AUTHENTICATION_PROPERTY_NAME,
  isNil,
  PackageType,
  PieceActionSettings,
  PieceType,
  UpdateActionRequest,
} from '@activepieces/shared';
import { PiecePropertiesFormValue } from '@activepieces/ui/feature-builder-form-controls';
import { PieceActionInputFormSchema } from '../../input-forms-schema';
import { fadeInUp400ms, isOverflown } from '@activepieces/ui/common';
import {
  BuilderSelectors,
  ConnectionDropdownItem,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import {
  ErrorHandlingOptionsParam,
  PieceAuthProperty,
  PiecePropertyMap,
} from '@activepieces/pieces-framework';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

declare type ActionDropdownOptionValue = {
  actionName: string;
  auth?: PieceAuthProperty;
  properties: PiecePropertyMap;
  errorHandlingOptions?: ErrorHandlingOptionsParam;
};

declare type ActionDropdownOption = {
  label: {
    name: string;
    description: string;
  };
  value: ActionDropdownOptionValue;
};
const ACTION_FORM_CONTROL_NAME = 'action';
const PIECE_PROPERTIES_FORM_CONTROL_NAME = 'configs';
const ERROR_HANDLING_FORM_CONTROL_NAME = 'errorHandlingOptions';
declare type ConfigsFormControlValue = {
  input: Record<string, string | Array<any> | object>;
  customizedInputs: Record<string, boolean>;
  propertiesValues?: Record<string, string | Array<any> | object>;
};

declare type ActionFormValue = {
  [ACTION_FORM_CONTROL_NAME]: string;
  [PIECE_PROPERTIES_FORM_CONTROL_NAME]: ConfigsFormControlValue;
  [ERROR_HANDLING_FORM_CONTROL_NAME]: ActionErrorHandlingOptions;
};
@Component({
  selector: 'app-piece-action-input-form',
  templateUrl: './piece-action-input-form.component.html',
  styleUrls: ['./piece-action-input-form.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: PieceActionInputFormComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: PieceActionInputFormComponent,
    },
  ],
  animations: [fadeInUp400ms],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieceActionInputFormComponent
  implements ControlValueAccessor, AfterViewInit
{
  readonly ERROR_HANDLING_FORM_CONTROL_NAME = ERROR_HANDLING_FORM_CONTROL_NAME;
  readonly ACTION_FORM_CONTROL_NAME = ACTION_FORM_CONTROL_NAME;
  readonly CONFIGS_FORM_CONTROL_NAME = PIECE_PROPERTIES_FORM_CONTROL_NAME;
  updateStepName$: Observable<void>;
  pieceActionForm: UntypedFormGroup;
  initialSetup$: Observable<ActionDropdownOption[]>;
  triggerInitialSetup$: Subject<true> = new Subject();
  packageType: PackageType;
  pieceType: PieceType;
  pieceName: string;
  pieceVersion: string;
  pieceDisplayName: string;
  initialComponentInputFormValue: PieceActionInputFormSchema | null;
  selectedAction$: Observable<ActionDropdownOption | undefined>;
  actions$: Observable<ActionDropdownOption[]>;
  valueChanges$: Observable<void>;
  actionDropdownValueChanged$: Observable<ActionDropdownOptionValue>;
  allAuthConfigs$: Observable<ConnectionDropdownItem[]>;
  hideContinueOnFailure = false;
  hideRetryOnFailure = false;
  isOverflown = isOverflown;
  onChange: (val: unknown) => void = (value) => {
    value;
  };
  onTouch: () => void = () => {
    //ignore
  };
  constructor(
    private fb: UntypedFormBuilder,
    private pieceMetadataService: PieceMetadataService,
    private cd: ChangeDetectorRef,
    private store: Store
  ) {
    this.buildForm();
    this.actionDropdownValueChanged$ = this.pieceActionForm
      .get(ACTION_FORM_CONTROL_NAME)!
      .valueChanges.pipe(
        tap((val) => {
          this.actionSelectValueChanged(val);
        })
      );
  }
  ngAfterViewInit(): void {
    this.triggerInitialSetup$.next(true);
  }

  private buildForm() {
    this.pieceActionForm = this.fb.group({
      [ACTION_FORM_CONTROL_NAME]: new UntypedFormControl(
        null,
        Validators.required
      ),
    });
    this.pieceActionForm.markAllAsTouched();

    this.valueChanges$ = this.pieceActionForm.valueChanges.pipe(
      startWith(null),
      pairwise(),
      tap((oldAndCurrentValues: [ActionFormValue | null, ActionFormValue]) => {
        this.onChange(this.getFormattedFormData(oldAndCurrentValues));
      }),
      map(() => void 0)
    );
  }

  fetchActions(pieceName: string, pieceVersion: string) {
    const pieceMetadata$ = this.pieceMetadataService.getPieceMetadata(
      pieceName,
      pieceVersion
    );
    this.actions$ = pieceMetadata$.pipe(
      map((pieceMetadata) => {
        return Object.entries(pieceMetadata.actions).map(
          ([actionName, action]) => {
            return {
              label: {
                name: action.displayName,
                description: action.description,
              },
              value: {
                actionName: actionName,
                auth: action.requireAuth ? pieceMetadata.auth : undefined,
                properties: action.props,
                errorHandlingOptions: action.errorHandlingOptions,
              },
            };
          }
        );
      }),
      tap(() => {
        this.triggerInitialSetup$.next(true);
      }),
      shareReplay(1)
    );
    this.initialSetup$ = this.triggerInitialSetup$.pipe(
      switchMap(() => {
        return this.actions$.pipe(
          tap((items) => {
            this.setInitialFormValue(items);
          })
        );
      })
    );
    this.triggerInitialSetup$.next(true);
  }
  private setInitialFormValue(items: ActionDropdownOption[]) {
    if (
      this.initialComponentInputFormValue &&
      this.initialComponentInputFormValue.actionName
    ) {
      this.pieceActionForm
        .get(ACTION_FORM_CONTROL_NAME)!
        .setValue(
          items.find(
            (i) =>
              i.value.actionName ===
              this.initialComponentInputFormValue?.actionName
          )?.value,
          {
            emitEvent: false,
          }
        );
      this.selectedAction$ = of(
        items.find(
          (it) =>
            it.value.actionName ===
            this.initialComponentInputFormValue?.actionName
        )
      ).pipe(
        tap((selectedAction) => {
          this.setInitialPropertiesFormValue(selectedAction);
        })
      );
    }
  }

  private setInitialPropertiesFormValue(
    selectedAction: ActionDropdownOption | undefined
  ) {
    if (selectedAction && this.initialComponentInputFormValue?.input) {
      let properties = {
        ...selectedAction.value.properties,
      };
      if (selectedAction.value.auth) {
        properties = {
          [AUTHENTICATION_PROPERTY_NAME]: selectedAction.value.auth,
          ...properties,
        };
      }
      const propertiesValues = this.initialComponentInputFormValue.input;
      const propertiesFormValue: PiecePropertiesFormValue = {
        properties: properties,
        propertiesValues: propertiesValues,
        setDefaultValues: false,
        customizedInputs:
          this.initialComponentInputFormValue.inputUiInfo?.customizedInputs ||
          {},
      };

      this.pieceActionForm.addControl(
        PIECE_PROPERTIES_FORM_CONTROL_NAME,
        new UntypedFormControl({
          value: propertiesFormValue,
          disabled: this.pieceActionForm.disabled,
        }),
        {
          emitEvent: false,
        }
      );
      if (!isNil(selectedAction.value.errorHandlingOptions)) {
        this.hideContinueOnFailure =
          selectedAction.value.errorHandlingOptions.continueOnFailure.hide ??
          false;
        this.hideRetryOnFailure =
          selectedAction.value.errorHandlingOptions.retryOnFailure.hide ??
          false;
      }
      const errorHandlingOptionsValue =
        this.initialComponentInputFormValue.errorHandlingOptions;
      this.pieceActionForm.addControl(
        ERROR_HANDLING_FORM_CONTROL_NAME,
        new UntypedFormControl({
          value: errorHandlingOptionsValue ?? {},
          disabled: this.pieceActionForm.disabled,
        }),
        { emitEvent: false }
      );
    }
  }

  writeValue(obj: PieceActionInputFormSchema): void {
    this.initialComponentInputFormValue = obj;
    this.packageType = obj.packageType;
    this.pieceType = obj.pieceType;
    this.pieceName = obj.pieceName;
    this.pieceVersion = obj.pieceVersion;
    this.pieceDisplayName = obj.pieceDisplayName;
    this.pieceActionForm
      .get(ACTION_FORM_CONTROL_NAME)
      ?.setValue(undefined, { emitEvent: false });
    this.pieceActionForm.removeControl(PIECE_PROPERTIES_FORM_CONTROL_NAME, {
      emitEvent: false,
    });
    this.pieceActionForm.removeControl(ERROR_HANDLING_FORM_CONTROL_NAME, {
      emitEvent: false,
    });

    if (obj.type === ActionType.PIECE) {
      this.fetchActions(obj.pieceName, obj.pieceVersion);
    }
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  validate() {
    if (this.pieceActionForm.valid) return null;
    return { invalid: true };
  }

  actionSelectValueChanged(
    selectedActionValue: ActionDropdownOptionValue | null
  ) {
    if (selectedActionValue) {
      this.actionSelected(selectedActionValue);
      this.selectedAction$ = this.findActionByActionName(
        selectedActionValue.actionName
      );
    }
  }

  private actionSelected(selectedActionValue: ActionDropdownOptionValue) {
    this.createOrSetErrorHandlingFormControl(selectedActionValue);
    this.createOrSetPropertiesFormControl(selectedActionValue);
    this.cd.detectChanges();
    this.pieceActionForm.updateValueAndValidity();
    this.updateStepName(selectedActionValue.actionName);
  }
  private createOrSetPropertiesFormControl(
    selectedActionValue: ActionDropdownOptionValue
  ) {
    const piecePropertiesForm = this.pieceActionForm.get(
      PIECE_PROPERTIES_FORM_CONTROL_NAME
    );
    const propertiesFormValue: PiecePropertiesFormValue = {
      properties: {
        ...selectedActionValue.properties,
      },
      setDefaultValues: true,
      customizedInputs: {},
      propertiesValues: {},
    };
    if (selectedActionValue.auth) {
      propertiesFormValue.properties = {
        [AUTHENTICATION_PROPERTY_NAME]: selectedActionValue.auth,
        ...propertiesFormValue.properties,
      };
    }
    if (!piecePropertiesForm) {
      this.pieceActionForm.addControl(
        PIECE_PROPERTIES_FORM_CONTROL_NAME,
        new UntypedFormControl(propertiesFormValue)
      );
    } else {
      piecePropertiesForm.setValue(propertiesFormValue);
    }
  }
  private createOrSetErrorHandlingFormControl(
    selectedActionValue: ActionDropdownOptionValue
  ) {
    const errorHandlingOptionsForm = this.pieceActionForm.get(
      ERROR_HANDLING_FORM_CONTROL_NAME
    );
    if (!isNil(selectedActionValue.errorHandlingOptions)) {
      this.hideContinueOnFailure =
        selectedActionValue.errorHandlingOptions.continueOnFailure.hide ??
        false;
      this.hideRetryOnFailure =
        selectedActionValue.errorHandlingOptions.retryOnFailure.hide ?? false;
    }
    const errorHandlingOptionsValue = {
      continueOnFailure: {
        value:
          selectedActionValue.errorHandlingOptions?.continueOnFailure
            .defaultValue ?? false,
      },
      retryOnFailure: {
        value:
          selectedActionValue.errorHandlingOptions?.retryOnFailure
            .defaultValue ?? false,
      },
    };
    if (!errorHandlingOptionsForm) {
      this.pieceActionForm.addControl(
        ERROR_HANDLING_FORM_CONTROL_NAME,
        new UntypedFormControl({
          value: errorHandlingOptionsValue,
          disabled: this.pieceActionForm.disabled,
        }),
        { emitEvent: false }
      );
    } else {
      errorHandlingOptionsForm.setValue(errorHandlingOptionsValue);
    }
  }

  getFormattedFormData(
    oldAndCurrentValues: [ActionFormValue | null, ActionFormValue]
  ): PieceActionSettings {
    let customizedInputs: Record<string, boolean>;
    if (
      oldAndCurrentValues[0] &&
      oldAndCurrentValues[0][ACTION_FORM_CONTROL_NAME] !==
        oldAndCurrentValues[1][ACTION_FORM_CONTROL_NAME]
    ) {
      customizedInputs = {};
    } else {
      customizedInputs =
        oldAndCurrentValues[1][PIECE_PROPERTIES_FORM_CONTROL_NAME]
          .customizedInputs;
    }
    const action: ActionDropdownOptionValue = this.pieceActionForm.get(
      ACTION_FORM_CONTROL_NAME
    )!.value;
    const configs: ConfigsFormControlValue =
      this.pieceActionForm.get(PIECE_PROPERTIES_FORM_CONTROL_NAME)?.value || {};
    let input: Record<string, string | Array<any> | object> = {};
    if (configs.input) {
      input = {
        ...configs.input,
      };
    } else {
      input = {
        ...(configs.propertiesValues as Record<
          string,
          string | Array<any> | object
        >),
      };
    }
    const errorHandlingOptions: ActionErrorHandlingOptions =
      this.pieceActionForm.get(ERROR_HANDLING_FORM_CONTROL_NAME)?.value;
    const res = {
      actionName: action?.actionName,
      input,
      packageType: this.packageType,
      pieceType: this.pieceType,
      pieceName: this.pieceName,
      pieceVersion: this.pieceVersion,
      inputUiInfo: { customizedInputs: customizedInputs },
      errorHandlingOptions: {
        ...errorHandlingOptions,
      },
    };

    return res;
  }
  actionDropdownCompareFn(
    item: { actionName: string },
    selected: { actionName: string } | undefined
  ) {
    return item.actionName === selected?.actionName;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.pieceActionForm.disable();
    } else {
      this.pieceActionForm.enable();
    }
  }
  findActionByActionName(actionNameLookup: string) {
    return this.actions$.pipe(
      map((items) => {
        return items.find((it) => it.value.actionName === actionNameLookup);
      })
    );
  }
  updateStepName(actionName: string) {
    this.updateStepName$ = forkJoin({
      action: this.findActionByActionName(actionName),
      step: this.store.select(BuilderSelectors.selectCurrentStep).pipe(take(1)),
    }).pipe(
      tap((res) => {
        if (res.step && res.action) {
          const clone = {
            ...res.step,
            displayName: res.action.label.name,
          } as UpdateActionRequest;

          this.store.dispatch(
            FlowsActions.updateAction({
              operation: clone,
            })
          );
        }
      }),
      map(() => void 0)
    );
  }
}
