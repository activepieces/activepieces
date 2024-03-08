import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  TemplateRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  UntypedFormGroup,
} from '@angular/forms';
import { map, Observable, tap } from 'rxjs';
import { ArrayProperty } from '@activepieces/pieces-framework';
import { createConfigsFormControls } from '../shared';

@Component({
  selector: 'app-array-form-control',
  templateUrl: './array-form-control.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ArrayFormControlComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: ArrayFormControlComponent,
    },
  ],
})
export class ArrayFormControlComponent implements ControlValueAccessor {
  formArray: FormArray<FormControl<string> | UntypedFormGroup>;
  @Input({ required: true }) formFieldsTemplate: TemplateRef<unknown>;
  @Input({ required: true }) property: ArrayProperty<true>;
  @Input({ required: true }) prefix: string;
  @Input() dynamicInputTemplate: TemplateRef<unknown>;

  updateValueOnChange$: Observable<void> = new Observable<void>();
  isArrayOfObjects: boolean = false;

  constructor(private fb: FormBuilder, private cd: ChangeDetectorRef) {
    this.formArray = this.fb.array([]) as FormArray<
      FormControl<string> | UntypedFormGroup
    >;
    this.updateValueOnChange$ = this.formArray.valueChanges.pipe(
      tap((value: unknown) => {
        this.onChange(value);
      }),
      map(() => void 0)
    );
  }

  createForm(propertiesValues: Record<string, unknown> | string) {
    const properties = this.property.properties;
    const arrayOfObjects = typeof propertiesValues !== 'string' &&
      properties &&
      Object.keys(properties).length > 0
    this.isArrayOfObjects = arrayOfObjects ?? false
    if (arrayOfObjects) {
      const controls = createConfigsFormControls(
        properties,
        propertiesValues as Record<string, unknown>,
        this.fb
      );
      this.formArray.push(this.fb.group(controls));
    } else {
      this.formArray.push(
        new FormControl<string>(propertiesValues as string, { nonNullable: true })
      );
    }
  }

  onChange: (val: unknown) => void = () => {
    //ignore
  };

  onTouched: () => void = () => {
    //ignore
  };


  /** type of value is string only when you swtich to customized inputs that happens because of change detection running before the form control is removed from template*/
  writeValue(pvalue: Array<string | Record<string, unknown>> | null): void {
    const values: Array<string | Record<string, unknown>> = pvalue
      ? JSON.parse(JSON.stringify(pvalue))
      : [];

    if (typeof pvalue !== 'string') {
      if (this.property.required && values.length === 0) {
        if (this.property.properties) {
          values.push({});
        } else {
          values.push('');
        }
      }

      this.formArray.clear();
      values.forEach((v) => {
        this.createForm(v);
      });
      this.formArray.markAllAsTouched();
      this.cd.markForCheck();
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
    if (this.isArrayOfObjects) {
      this.createForm({});
      this.formArray.markAllAsTouched();
      this.cd.markForCheck();
    } else {
      this.createForm('');
    }
  }

  remove(index: number) {
    if (index >= 0 && index < this.formArray.length) {
      this.formArray.removeAt(index);
    }
  }

  getFormControlAtIndex(index: number): FormControl {
    const control = this.formArray.controls[index];
    return control as any;
  }

  itemsCanBeDeleted(): boolean {
    const isEnabled = this.formArray.enabled;
    const isRequiredAndHasMoreThanOneItem =
      this.property.required && this.formArray.controls.length > 1;
    const isNotRequired = !this.property.required;
    return isEnabled && (isRequiredAndHasMoreThanOneItem || isNotRequired);
  }
}
