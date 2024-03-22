import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionErrorHandlingFormControlComponent
  implements ControlValueAccessor
{
  errorHandlingOptionsForm: FormGroup<{
    continueOnFailure: FormControl<boolean>;
    retryOnFailure: FormControl<boolean>;
  }>;
  @Input() hideContinueOnFailure = false;
  @Input() hideRetryOnFailure = false;
  @Output() valueChanged = new EventEmitter<ActionErrorHandlingOptions>();
  valueChanges$: Observable<void>;
  onChange: (val: unknown) => void = () => {
    //ignore
  };
  onTouched: () => void = () => {
    //ignore
  };

  constructor(private fb: FormBuilder) {
    this.errorHandlingOptionsForm = this.fb.group({
      continueOnFailure: this.fb.control(false, {
        nonNullable: true,
      }),
      retryOnFailure: this.fb.control(false, {
        nonNullable: true,
      }),
    });
    this.valueChanges$ = this.errorHandlingOptionsForm.valueChanges.pipe(
      tap((val) => {
        const result: ActionErrorHandlingOptions = {
          continueOnFailure:
            this.hideContinueOnFailure || val.continueOnFailure === undefined
              ? undefined
              : {
                  value: val.continueOnFailure,
                },
          retryOnFailure:
            this.hideRetryOnFailure || val.retryOnFailure === undefined
              ? undefined
              : {
                  value: val.retryOnFailure,
                },
        };
        this.valueChanged.emit(result);
        this.onChange(result);
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
          continueOnFailure: this.hideRetryOnFailure
            ? false
            : obj.continueOnFailure?.value || false,
          retryOnFailure: this.hideRetryOnFailure
            ? false
            : obj.retryOnFailure?.value || false,
        },
        { emitEvent: false }
      );
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
