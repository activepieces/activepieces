import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import { forkJoin, map, Observable, of, shareReplay, take, tap } from 'rxjs';
import {
  TriggerType,
  UpdateTriggerRequest,
  AUTHENTICATION_PROPERTY_NAME,
  PackageType,
  PieceType,
} from '@activepieces/shared';
import {
  PieceAuthProperty,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { fadeInUp400ms } from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  ConnectionDropdownItem,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { PiecePropertiesFormValue } from '@activepieces/ui/feature-builder-form-controls';
import { PieceTriggerInputFormSchema } from '../../input-forms-schema';
import { PiecePropertyMap } from '@activepieces/pieces-framework';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

declare type TriggerDropdownOption = {
  label: {
    name: string;
    description: string;
    isWebhook: boolean;
  };
  value: {
    triggerName: string;
    properties: PiecePropertyMap;
    auth?: PieceAuthProperty;
  };
  disabled?: boolean;
};

const TRIGGER_FORM_CONTROL_NAME = 'triggers';
const PIECE_PROPERTIES_FORM_CONTROL_NAME = 'configs';

@Component({
  selector: 'app-piece-trigger-input-form',
  templateUrl: './piece-trigger-input-form.component.html',
  styleUrls: ['./piece-trigger-input-form.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: PieceTriggerInputFormComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: PieceTriggerInputFormComponent,
    },
  ],
  animations: [fadeInUp400ms],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieceTriggerInputFormComponent {
  readonly TRIGGER_FORM_CONTROL_NAME = TRIGGER_FORM_CONTROL_NAME;
  readonly CONFIGS_FORM_CONTROL_NAME = PIECE_PROPERTIES_FORM_CONTROL_NAME;
  pieceTriggerInputForm: UntypedFormGroup;
  initialSetup$: Observable<TriggerDropdownOption[]>;
  packageType: PackageType;
  pieceType: PieceType;
  pieceName: string;
  pieceDisplayName: string;
  pieceVersion: string;
  initialComponentTriggerInputFormValue: PieceTriggerInputFormSchema | null;
  selectedTrigger$: Observable<any>;
  triggers$: Observable<TriggerDropdownOption[]>;
  valueChanges$: Observable<void>;
  triggerDropdownValueChanged$: Observable<{
    triggerName: string;
    properties: PiecePropertyMap;
  }>;
  allAuthConfigs$: Observable<ConnectionDropdownItem[]>;
  updateStepName$: Observable<void>;
  onChange: (value: unknown) => void = (value) => {
    value;
  };
  onTouch: () => void = () => {
    //ignore
  };

  constructor(
    private fb: UntypedFormBuilder,
    private pieceService: PieceMetadataService,
    private cd: ChangeDetectorRef,
    private store: Store
  ) {
    this.buildForm();
    this.triggerDropdownValueChanged$ = this.pieceTriggerInputForm
      .get(TRIGGER_FORM_CONTROL_NAME)!
      .valueChanges.pipe(
        tap((val) => {
          this.triggerSelectValueChanged(val);
        })
      );
  }

  customSearchFn(term: string, item: any) {
    const termLowerCase = term.toLowerCase();
    const result =
      item.label.url.toLowerCase().indexOf(termLowerCase) > -1 ||
      item.label.summary.toLowerCase().indexOf(termLowerCase) > -1 ||
      item.label.description.toLowerCase().indexOf(termLowerCase) > -1 ||
      item.label.requestType.toLowerCase().indexOf(termLowerCase) > -1;
    return result;
  }

  private buildForm() {
    this.pieceTriggerInputForm = this.fb.group({
      [TRIGGER_FORM_CONTROL_NAME]: new UntypedFormControl(
        null,
        Validators.required
      ),
    });
    this.pieceTriggerInputForm.markAllAsTouched();
    this.valueChanges$ = this.pieceTriggerInputForm.valueChanges.pipe(
      tap(() => {
        this.onChange(this.getFormattedFormData());
      })
    );
  }

  fetchTriggers(pieceName: string, pieceVersion: string) {
    const piece$ = this.pieceService.getPieceMetadata(pieceName, pieceVersion);

    this.triggers$ = piece$.pipe(
      map((pieceMetadata) => {
        return Object.entries(pieceMetadata.triggers).map(
          ([triggerName, trigger]) => {
            return {
              label: {
                name: trigger.displayName,
                description: trigger.description,
                isWebhook:
                  trigger.type === TriggerStrategy.WEBHOOK ||
                  trigger.type === TriggerStrategy.APP_WEBHOOK,
              },
              value: {
                triggerName: triggerName,
                auth: pieceMetadata.auth,
                properties: trigger.props,
              },
            };
          }
        );
      }),
      shareReplay(1)
    );
    this.initialSetup$ = this.triggers$.pipe(
      tap((items) => {
        this.initialiseConfigsFormValue(items);
      })
    );
  }
  private initialiseConfigsFormValue(items: TriggerDropdownOption[]) {
    if (
      this.initialComponentTriggerInputFormValue &&
      this.initialComponentTriggerInputFormValue.triggerName
    ) {
      this.pieceTriggerInputForm
        .get(TRIGGER_FORM_CONTROL_NAME)!
        .setValue(
          items.find(
            (i) =>
              i.value.triggerName ===
              this.initialComponentTriggerInputFormValue?.triggerName
          )?.value,
          {
            emitEvent: false,
          }
        );
      this.selectedTrigger$ = of(
        items.find(
          (it) =>
            it.value.triggerName ===
            this.initialComponentTriggerInputFormValue?.triggerName
        )
      ).pipe(
        tap((selectedTrigger) => {
          if (selectedTrigger) {
            let properties = {
              ...selectedTrigger.value.properties,
            };
            if (selectedTrigger.value.auth) {
              properties = {
                [AUTHENTICATION_PROPERTY_NAME]: selectedTrigger.value.auth!,
                ...properties,
              };
            }
            const propertiesValues =
              this.initialComponentTriggerInputFormValue!.input;
            const propertiesFormValue: PiecePropertiesFormValue = {
              properties: properties,
              propertiesValues: propertiesValues,
              setDefaultValues: false,
              customizedInputs:
                this.initialComponentTriggerInputFormValue?.inputUiInfo
                  ?.customizedInputs || {},
            };
            this.pieceTriggerInputForm.addControl(
              PIECE_PROPERTIES_FORM_CONTROL_NAME,
              new UntypedFormControl({
                value: propertiesFormValue,
                disabled: this.pieceTriggerInputForm.disabled,
              }),
              {
                emitEvent: false,
              }
            );
          }
        })
      );
    }
  }

  writeValue(obj: PieceTriggerInputFormSchema): void {
    this.initialComponentTriggerInputFormValue = obj;
    this.packageType = obj.packageType;
    this.pieceType = obj.pieceType;
    this.pieceName = obj.pieceName;
    this.pieceVersion = obj.pieceVersion;
    this.pieceDisplayName = obj.pieceDisplayName;
    this.pieceTriggerInputForm
      .get(TRIGGER_FORM_CONTROL_NAME)
      ?.setValue(undefined, { emitEvent: false });
    this.pieceTriggerInputForm.removeControl(
      PIECE_PROPERTIES_FORM_CONTROL_NAME,
      {
        emitEvent: false,
      }
    );

    if (obj.type === TriggerType.PIECE) {
      this.fetchTriggers(obj.pieceName, obj.pieceVersion);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  validate() {
    if (this.pieceTriggerInputForm.valid) return null;
    return { invalid: true };
  }

  triggerSelectValueChanged(
    selectedValue: { triggerName: string; properties: PiecePropertyMap } | null
  ) {
    if (selectedValue) {
      this.triggerSelected(selectedValue);
      this.selectedTrigger$ = this.findTriggerByTriggerName(
        selectedValue.triggerName
      );
    }
  }
  findTriggerByTriggerName(triggerName: string) {
    return this.triggers$.pipe(
      map((items) => {
        return items.find((it) => it.value.triggerName === triggerName);
      })
    );
  }
  private triggerSelected(selectedValue: {
    triggerName: string;
    auth?: PieceAuthProperty;
    properties: PiecePropertyMap;
  }) {
    const propertiesForm = this.pieceTriggerInputForm.get(
      PIECE_PROPERTIES_FORM_CONTROL_NAME
    );
    let properties = {
      ...selectedValue.properties,
    };
    if (selectedValue.auth) {
      properties = {
        [AUTHENTICATION_PROPERTY_NAME]: selectedValue.auth!,
        ...properties,
      };
    }
    const propertiesFormValue: PiecePropertiesFormValue = {
      properties: properties,
      propertiesValues: {},
      setDefaultValues: true,
      customizedInputs: {},
    };
    if (!propertiesForm) {
      this.pieceTriggerInputForm.addControl(
        PIECE_PROPERTIES_FORM_CONTROL_NAME,
        new UntypedFormControl(propertiesFormValue)
      );
    } else {
      propertiesForm.setValue(propertiesFormValue);
    }
    this.cd.detectChanges();
    this.pieceTriggerInputForm.updateValueAndValidity();
    this.updateStepName(selectedValue.triggerName);
  }

  getFormattedFormData(): {
    triggerName: string;
    input: { [configKey: string]: any };
    inputUiInfo: { customizedInputs?: Record<string, boolean> };
  } {
    const trigger = this.pieceTriggerInputForm.get(
      TRIGGER_FORM_CONTROL_NAME
    )!.value;
    const configs =
      this.pieceTriggerInputForm.get(PIECE_PROPERTIES_FORM_CONTROL_NAME)
        ?.value || {};
    const res = {
      triggerName: trigger?.triggerName,
      input: {
        ...configs.input,
      },
      inputUiInfo: { customizedInputs: configs.customizedInputs },
    };
    return res;
  }
  triggerDropdownCompareFn(
    item: { triggerName: string },
    selected: { triggerName: string } | undefined
  ) {
    return item.triggerName === selected?.triggerName;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.pieceTriggerInputForm.disable();
    } else {
      this.pieceTriggerInputForm.enable();
    }
  }
  updateStepName(triggerName: string) {
    this.updateStepName$ = forkJoin({
      action: this.findTriggerByTriggerName(triggerName),
      step: this.store.select(BuilderSelectors.selectCurrentStep).pipe(take(1)),
    }).pipe(
      tap((res) => {
        if (res.step && res.action) {
          const clone = {
            ...res.step,
            displayName: res.action.label.name,
          } as UpdateTriggerRequest;

          this.store.dispatch(
            FlowsActions.updateTrigger({
              operation: clone,
            })
          );
        }
      }),
      map(() => void 0)
    );
  }
}
