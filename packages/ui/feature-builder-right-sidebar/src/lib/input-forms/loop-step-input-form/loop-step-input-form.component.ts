import { Component, Input } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
  FormControl,
  FormGroup,
  FormBuilder,
} from '@angular/forms';

import { Observable, tap } from 'rxjs';
import {
  ActionType,
  LoopOnItemsAction,
  LoopOnItemsActionSettings,
} from '@activepieces/shared';
import { fadeInUp400ms, InsertMentionOperation } from '@activepieces/ui/common';
import { InterpolatingTextFormControlComponent } from '@activepieces/ui/feature-builder-form-controls';
import { LoopStepInputFormSchema } from '../input-forms-schema';

@Component({
  selector: 'app-loop-step-input-form',
  templateUrl: './loop-step-input-form.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: LoopStepInputFormComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: LoopStepInputFormComponent,
    },
  ],
  animations: [fadeInUp400ms],
})
export class LoopStepInputFormComponent implements ControlValueAccessor {
  @Input({ required: true }) step!: LoopOnItemsAction;
  loopStepForm: FormGroup<{ items: FormControl<string> }>;
  updateComponentValue$: Observable<any>;
  onChange: (val: Omit<LoopOnItemsActionSettings, 'inputUiInfo'>) => void = (
    value: Omit<LoopOnItemsActionSettings, 'inputUiInfo'>
  ) => {
    //ignore
    value;
  };
  onTouch: () => void = () => {
    //ignore
  };

  constructor(private formBuilder: FormBuilder) {
    this.loopStepForm = this.formBuilder.group({
      items: new FormControl('', {
        nonNullable: true,
        validators: Validators.required,
      }),
    });
    this.loopStepForm.controls.items.disable();
    this.loopStepForm.markAllAsTouched();
    this.updateComponentValue$ = this.loopStepForm.valueChanges.pipe(
      tap(() => {
        this.onChange({
          ...this.loopStepForm.getRawValue(),
        });
      })
    );
  }

  writeValue(obj: LoopStepInputFormSchema): void {
    if (obj.type === ActionType.LOOP_ON_ITEMS) {
      this.loopStepForm.patchValue(obj, { emitEvent: false });
    }
  }
  registerOnChange(fn: (val: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  validate() {
    if (this.loopStepForm.invalid) {
      return { invalid: true };
    }
    return null;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.loopStepForm.disable();
    } else if (this.loopStepForm.disabled) {
      this.loopStepForm.enable();
    }
  }
  async addMention(
    textControl: InterpolatingTextFormControlComponent,
    mentionOp: InsertMentionOperation
  ) {
    await textControl.addMention(mentionOp);
  }
}
