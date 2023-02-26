import { Component } from '@angular/core';
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
import { ActionType } from '@activepieces/shared';
import { LoopStepInputFormSchema } from '../input-forms-schema';
import { fadeInUp400ms } from '../../../../../../../../common/animation/fade-in-up.animation';

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
  loopStepForm: FormGroup<{ items: FormControl<string> }>;
  updateComponentValue$: Observable<any>;
  onChange = (value: LoopStepInputFormSchema) => {};
  onTouch = () => {};

  constructor(private formBuilder: FormBuilder) {
    this.loopStepForm = this.formBuilder.group({
      items: new FormControl('', {
        nonNullable: true,
        validators: Validators.required,
      }),
    });
    this.updateComponentValue$ = this.loopStepForm.valueChanges.pipe(
      tap(() => {
        this.onChange(this.loopStepForm.getRawValue());
      })
    );
  }

  writeValue(obj: LoopStepInputFormSchema): void {
    if (obj.type === ActionType.LOOP_ON_ITEMS) {
      this.loopStepForm.patchValue(obj);
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  validate() {
    if (this.loopStepForm.invalid) {
      return { invalid: true };
    }
    return null;
  }

  getControl(name: string) {
    return this.loopStepForm.get(name)!;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.loopStepForm.disable();
    } else if (this.loopStepForm.disabled) {
      this.loopStepForm.enable();
    }
  }
}
