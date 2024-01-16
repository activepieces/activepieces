import { Component, Input } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { map, Observable, tap } from 'rxjs';
import { ActionErrorHandlingOptions } from '@activepieces/shared';

@Component({
  selector: 'app-action-error-handling-form-control',
  templateUrl: './action-error-handling-form-control.component.html',
  styleUrls: ['./action-error-handling-form-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ActionErrorHandlingFormControlComponent,
    },
  ],
})
export class ActionErrorHandlingFormControlComponent
  implements ControlValueAccessor
{
  errorHandlingOptionsForm: FormGroup<{
    continueOnFailure: FormGroup<{
      value: FormControl<boolean>;
    }>;
    retryOnFailure: FormGroup<{
      value: FormControl<boolean>;
    }>;
  }>;
  @Input() hideContinueOnFailure: boolean;
  @Input() hideRetryOnFailure: boolean;
  valueChanges$: Observable<void>;
  onChange: (val: unknown) => void = () => {
    //ignore
  };
  onTouched: () => void = () => {
    //ignore
  };

  constructor(private fb: FormBuilder) {
    this.errorHandlingOptionsForm = this.fb.group({
      continueOnFailure: this.fb.group({
        value: new FormControl(false, {
          nonNullable: true,
        }),
      }),
      retryOnFailure: this.fb.group({
        value: new FormControl(false, {
          nonNullable: true,
        }),
      }),
    });
    this.valueChanges$ = this.errorHandlingOptionsForm.valueChanges.pipe(
      tap((val) => {
        this.onChange(val);
      }),
      map(() => {
        return void 0;
      })
    );
  }

  writeValue(obj: ActionErrorHandlingOptions): void {
    if (obj) {
      this.errorHandlingOptionsForm.setValue(
        {
          continueOnFailure: {
            value:
              obj.continueOnFailure.value ?? obj.continueOnFailure.defaultValue,
          },
          retryOnFailure: {
            value: obj.retryOnFailure.value ?? obj.retryOnFailure.defaultValue,
          },
        },
        { emitEvent: false }
      );
    } else {
      this.errorHandlingOptionsForm.reset({}, { emitEvent: false });
    }
  }
  registerOnChange(fn: (val: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.errorHandlingOptionsForm.disable();
    } else if (this.errorHandlingOptionsForm.disabled) {
      this.errorHandlingOptionsForm.enable();
    }
  }
}
