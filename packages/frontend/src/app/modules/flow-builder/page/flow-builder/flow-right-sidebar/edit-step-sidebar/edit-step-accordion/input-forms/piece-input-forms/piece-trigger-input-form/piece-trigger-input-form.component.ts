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
import { map, Observable, of, tap } from 'rxjs';
import { fadeInUp400ms } from '../../../../../../../../../common/animation/fade-in-up.animation';
import {
  PieceConfig,
  propsConvertor,
} from '../../../../../../../../../common/components/configs-form/connector-action-or-config';
import { DropdownItem } from '../../../../../../../../../common/model/dropdown-item.interface';
import { ActionMetaService } from '../../../../../../../../service/action-meta.service';
import { ComponentTriggerInputFormSchema } from '../../input-forms-schema';

declare type TriggerDropdownOption = {
  label: {
    name: string;
    description: string;
    isWebhook: boolean;
  };
  value: { triggerName: string; configs: PieceConfig[]; separator?: boolean };
  disabled?: boolean;
};

const TRIGGER_FORM_CONTROL_NAME = 'triggers';
const CONFIGS_FORM_CONTROL_NAME = 'configs';

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
  readonly CONFIGS_FORM_CONTROL_NAME = CONFIGS_FORM_CONTROL_NAME;
  componentForm: UntypedFormGroup;
  initialSetup$: Observable<TriggerDropdownOption[]>;
  componentName: string;
  intialComponentTriggerInputFormValue: {
    triggerName: string;
    input: { [key: string]: any };
  } | null;
  selectedTrigger$: Observable<any>;
  triggers$: Observable<TriggerDropdownOption[]>;
  valueChanges$: Observable<void>;
  triggerDropdownValueChanged$: Observable<{
    triggerName: string;
    configs: PieceConfig[];
  }>;
  allAuthConfigs$: Observable<DropdownItem[]>;

  onChange: (value) => void = (value) => {
    value;
  };
  onTouch: () => void = () => {
    //ignore
  };

  constructor(
    private fb: UntypedFormBuilder,
    private actionMetaDataService: ActionMetaService,
    private cd: ChangeDetectorRef
  ) {
    this.buildForm();
    this.triggerDropdownValueChanged$ = this.componentForm
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
    this.componentForm = this.fb.group({
      [TRIGGER_FORM_CONTROL_NAME]: new UntypedFormControl(
        null,
        Validators.required
      ),
    });
    this.componentForm.markAllAsTouched();
    this.valueChanges$ = this.componentForm.valueChanges.pipe(
      tap(() => {
        this.onChange(this.getFormattedFormData());
      })
    );
  }

  fetchTriggers(pieceName: string) {
    const piece$ = this.actionMetaDataService.getPieces().pipe(
      map((pieces) => {
        const component = pieces.find((c) => c.name === pieceName);
        if (!component) {
          throw new Error(`Activepieces- piece not found: ${pieceName}`);
        }
        return component;
      })
    );
    this.triggers$ = piece$.pipe(
      map((component) => {
        const triggersKeys = Object.keys(component.triggers);
        return triggersKeys.map((triggerName) => {
          const trigger = component.triggers[triggerName];
          const configs = Object.entries(trigger.props).map((keyEntry) => {
            return propsConvertor.convertToFrontEndConfig(
              keyEntry[0],
              keyEntry[1]
            );
          });
          return {
            value: {
              triggerName: triggerName,
              configs: configs,
            },
            label: {
              name: trigger.displayName,
              description: trigger.description,
              isWebhook:
                component.triggers[triggerName].type === 'WEBHOOK' ||
                component.triggers[triggerName].type === 'APP_WEBHOOK',
            },
          };
        });
      })
    );
    this.initialSetup$ = this.triggers$.pipe(
      tap((items) => {
        if (
          this.intialComponentTriggerInputFormValue &&
          this.intialComponentTriggerInputFormValue.triggerName
        ) {
          this.componentForm
            .get(TRIGGER_FORM_CONTROL_NAME)!
            .setValue(
              items.find(
                (i) =>
                  i.value.triggerName ===
                  this.intialComponentTriggerInputFormValue?.triggerName
              )?.value,
              {
                emitEvent: false,
              }
            );
          this.selectedTrigger$ = of(
            items.find(
              (it) =>
                it.value.triggerName ===
                this.intialComponentTriggerInputFormValue?.triggerName
            )
          ).pipe(
            tap((selectedTrigger) => {
              if (selectedTrigger) {
                const configs = [...selectedTrigger.value.configs];
                const configsValues =
                  this.intialComponentTriggerInputFormValue?.input;
                if (configsValues) {
                  Object.keys(configsValues).forEach((key) => {
                    const config = configs.find((c) => c.key === key);
                    if (config) {
                      config.value = configsValues[key];
                    }
                  });
                }
                this.componentForm.addControl(
                  CONFIGS_FORM_CONTROL_NAME,
                  new UntypedFormControl({
                    value: [...configs],
                    disabled: this.componentForm.disabled,
                  }),
                  {
                    emitEvent: false,
                  }
                );
                this.cd.detectChanges();
              }
            })
          );
        }
      })
    );
  }
  writeValue(obj: ComponentTriggerInputFormSchema): void {
    this.intialComponentTriggerInputFormValue = obj;
    this.componentName = obj.pieceName;
    this.componentForm
      .get(TRIGGER_FORM_CONTROL_NAME)
      ?.setValue(undefined, { emitEvent: false });
    this.componentForm.removeControl(CONFIGS_FORM_CONTROL_NAME, {
      emitEvent: false,
    });
    this.fetchTriggers(obj.pieceName);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  validate() {
    if (this.componentForm.valid) return null;
    return { invalid: true };
  }

  triggerSelectValueChanged(
    selectedValue: { triggerName: string; configs: PieceConfig[] } | null
  ) {
    if (selectedValue) {
      this.triggerSelected(selectedValue);
      this.selectedTrigger$ = this.triggers$.pipe(
        map((items) => {
          return items.find(
            (it) => it.value.triggerName === selectedValue.triggerName
          );
        })
      );
    }
  }

  private triggerSelected(selectedValue: {
    triggerName: string;
    configs: PieceConfig[];
  }) {
    const configsForm = this.componentForm.get(CONFIGS_FORM_CONTROL_NAME);
    if (!configsForm) {
      this.componentForm.addControl(
        CONFIGS_FORM_CONTROL_NAME,
        new UntypedFormControl([...selectedValue.configs])
      );
    } else {
      configsForm.setValue([...selectedValue.configs]);
    }
    this.cd.detectChanges();
    this.componentForm.updateValueAndValidity();
  }

  getFormattedFormData(): {
    triggerName: string;
    input: { [configKey: string]: any };
  } {
    const trigger = this.componentForm.get(TRIGGER_FORM_CONTROL_NAME)!.value;
    const configs =
      this.componentForm.get(CONFIGS_FORM_CONTROL_NAME)?.value || {};
    const res = {
      triggerName: trigger?.triggerName,
      input: {
        ...configs,
      },
    };
    return res;
  }
  triggerDropdownCompareFn(item, selected) {
    return item.triggerName === selected.triggerName;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.componentForm.disable();
    } else {
      this.componentForm.enable();
    }
  }
}
