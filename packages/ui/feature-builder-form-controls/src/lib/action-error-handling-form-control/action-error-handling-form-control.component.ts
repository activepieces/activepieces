import { Component } from '@angular/core';
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
    continueOnFailure: FormControl<boolean>;
    retryOnFailure: FormControl<boolean>;
    hideContinueOnFailure: FormControl<boolean>;
    hideRetryOnFailure: FormControl<boolean>;
  }>;
  hideContinueOnFailure: boolean;
  hideRetryOnFailure: boolean;
  valueChanges$: Observable<void>;
  onChange: (val: unknown) => void = () => {
    //ignore
  };
  onTouched: () => void = () => {
    //ignore
  };

  constructor(private fb: FormBuilder) {
    this.errorHandlingOptionsForm = this.fb.group({
      continueOnFailure: new FormControl(false, {
        nonNullable: true,
      }),
      retryOnFailure: new FormControl(false, {
        nonNullable: true,
      }),
      hideContinueOnFailure: new FormControl(false, {
        nonNullable: true,
      }),
      hideRetryOnFailure: new FormControl(false, {
        nonNullable: true,
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
      this.errorHandlingOptionsForm.setValue(obj, { emitEvent: false });
      this.hideContinueOnFailure = obj.hideContinueOnFailure;
      this.hideRetryOnFailure = obj.hideRetryOnFailure;
    } else {
      this.errorHandlingOptionsForm.reset({}, { emitEvent: false });
      this.hideContinueOnFailure = false;
      this.hideRetryOnFailure = false;
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
