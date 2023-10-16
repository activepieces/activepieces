import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  UntypedFormControl,
  UntypedFormGroup,
} from '@angular/forms';
import { map, Observable, tap } from 'rxjs';
import { InterpolatingTextFormControlComponent } from '../interpolating-text-form-control/interpolating-text-form-control.component';
import { InsertMentionOperation } from '@activepieces/ui/common';
import {
  ArrayProperty,
  PiecePropertyMap,
} from '@activepieces/pieces-framework';

type CreateConfigsFormControls = (
  properties: PiecePropertyMap,
  propertiesValues: Record<string, unknown>
) => {
  [key: string]: UntypedFormControl | UntypedFormGroup;
};
@Component({
  selector: 'app-array-form-control',
  templateUrl: './array-form-control.component.html',
  styleUrls: ['./array-form-control.component.scss'],
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
  @Input() formFieldsTemplate: TemplateRef<any>;
  @Input() property: ArrayProperty<true>;
  @Input() prefix: string;
  @Input() createConfigsFormControls: CreateConfigsFormControls;

  @ViewChild('textControl') firstInput: InterpolatingTextFormControlComponent;

  updateValueOnChange$: Observable<void> = new Observable<void>();

  createForm(propertiesValues: Record<string, unknown> | string) {
    const properties = this.property.properties;
    if (
      typeof propertiesValues !== 'string' &&
      properties &&
      Object.keys(properties).length > 0
    ) {
      const controls = this.createConfigsFormControls(
        properties,
        propertiesValues
      );

      this.formArray.push(
        this.fb.group({
          ...controls,
        })
      );
    } else if (typeof propertiesValues === 'string') {
      this.formArray.push(
        new FormControl<string>(propertiesValues, { nonNullable: true })
      );
    }
  }

  onChange: (val: unknown) => void = () => {
    //ignore
  };
  onTouched: () => void = () => {
    //ignore
  };

  constructor(private fb: FormBuilder, private cd: ChangeDetectorRef) {
    this.formArray = this.fb.array([]) as FormArray<
      FormControl<string> | UntypedFormGroup
    >;
  }

  writeValue(pvalue: Array<string | Record<string, unknown>>): void {
    const values = pvalue;

    // if the values i empty add one elment to array
    if (!values || values.length === 0) {
      if (this.property.properties) {
        values.push({});
      } else {
        values.push('');
      }
    }

    this.formArray.clear();

    // create form for each value
    values.forEach((v) => {
      this.createForm(v);
    });

    this.updateValueOnChange$ = this.formArray.valueChanges.pipe(
      tap((value) => {
        this.onChange(value);
      }),
      map(() => void 0)
    );

    this.formArray.markAllAsTouched();
    this.cd.markForCheck();
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
    if (
      this.property &&
      Object.keys(this.property.properties || {}).length > 0
    ) {
      // If the property indicates that we're dealing with an array of objects

      this.createForm({});

      this.formArray.markAllAsTouched();
      this.cd.markForCheck();
    } else {
      this.createForm('');
    }
  }

  removeValue(index: number) {
    if (
      this.property &&
      Object.keys(this.property.properties || {}).length > 0
    ) {
      if (
        (this.property.required && this.formArray.controls.length > 1) ||
        !this.property.required
      ) {
        this.formArray.removeAt(index);
      }
    } else if (this.formArray.controls.length > 1) {
      this.formArray.removeAt(index);
    }
  }

  async addMention(
    textControl: InterpolatingTextFormControlComponent,
    mention: InsertMentionOperation
  ) {
    await textControl.addMention(mention);
  }
  focusFirstInput() {
    this.firstInput.focusEditor();
  }

  getFormControlAtIndex(index: number): FormControl {
    const control = this.formArray.controls[index];
    return control as any;
  }
  getFormControlGroupAtIndex(c: any): FormControl {
    return c as any;
  }
  validate() {
    if (this.formArray.invalid) {
      return { invalid: true };
    }
    return null;
  }
}
