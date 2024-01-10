import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { map, Observable, tap } from 'rxjs';
@Component({
  selector: 'ap-array-form-control',
  templateUrl: './array-form-control.component.html',
  styleUrls: ['./array-form-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ArrayFormControlComponent,
    },
  ],
})
export class ArrayFormControlComponent implements ControlValueAccessor {
  valueChanges$: Observable<void>;
  formArray: FormArray<FormControl<string>>;
  @Input({ required: true }) placeholder = '';
  @Input() addEmptyFieldAfterWriteValue = true;
  onChange: (val: unknown) => void = () => {
    //ignore
  };
  onTouched: () => void = () => {
    //ignore
  };

  constructor(private fb: FormBuilder) {
    this.formArray = this.fb.array([
      new FormControl<string>(''),
    ] as FormControl<string>[]);
    this.valueChanges$ = this.formArray.valueChanges.pipe(
      tap((val) => {
        this.onChange(val.filter((v) => v !== ''));
      }),
      map(() => {
        return void 0;
      })
    );
  }
  writeValue(obj: string[]): void {
    if (obj) {
      this.formArray.clear();
      obj.forEach((val) => {
        this.formArray.push(
          new FormControl<string>(val, { nonNullable: true }),
          { emitEvent: false }
        );
      });
      if (obj.length === 0) {
        this.formArray.push(
          new FormControl<string>('', { nonNullable: true }),
          { emitEvent: false }
        );
      }
      if (
        this.formArray.length > 0 &&
        this.formArray.controls[this.formArray.length - 1].value &&
        this.addEmptyFieldAfterWriteValue
      ) {
        this.formArray.push(new FormControl<string>('', { nonNullable: true }));
      }
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
      this.formArray.disable();
    } else {
      this.formArray.enable();
    }
  }
  addValue() {
    this.formArray.push(new FormControl<string>('', { nonNullable: true }));
  }
  removeValue(index: number) {
    if (this.formArray.controls.length > 1) {
      this.formArray.removeAt(index);
    }
  }
}
