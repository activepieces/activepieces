import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { map, Observable, tap } from 'rxjs';
import { ActionErrorHandlingOptions } from '@activepieces/shared';
import { BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM } from '@activepieces/ui/common';

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
  readonly BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM =
    BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM;
  continueOnFailureDescriptionExpanded = false;
  continueOnFailureDescriptionOverflows = false;
  @Input() hideContinueOnFailure = false;
  @Input() hideRetryOnFailure = false;
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
        this.onChange({
          continueOnFailure: this.hideContinueOnFailure
            ? undefined
            : {
                value: val.continueOnFailure,
              },
          retryOnFailure: this.hideRetryOnFailure
            ? undefined
            : {
                value: val.retryOnFailure,
              },
        });
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
