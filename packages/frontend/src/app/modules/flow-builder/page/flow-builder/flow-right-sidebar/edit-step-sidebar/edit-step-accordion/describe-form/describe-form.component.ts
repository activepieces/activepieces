import { Component } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import { tap } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { fadeInUp400ms } from '../../../../../../../common/animation/fade-in-up.animation';

interface DescribeForm {
  displayName: FormControl<string>;
  name: FormControl<string>;
}
@Component({
  selector: 'app-describe-form',
  templateUrl: './describe-form.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: DescribeFormComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: DescribeFormComponent,
    },
  ],
  animations: [fadeInUp400ms],
})
export class DescribeFormComponent implements ControlValueAccessor {
  describeForm: FormGroup<DescribeForm>;
  updateComponentValue$: Observable<any>;

  OnChange: (value) => void = (value) => {
    value;
  };
  onTouched: () => void = () => {
    //ignore
  };
  constructor(private formBuilder: FormBuilder) {
    this.describeForm = this.formBuilder.group({
      displayName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      name: new FormControl('', { nonNullable: true }),
    });
    this.describeForm.controls.name.disable();
    this.describeForm.markAsTouched();
    this.updateComponentValue$ = this.describeForm.valueChanges.pipe(
      tap((value) => {
        this.OnChange(this.describeForm.getRawValue());
      })
    );
    this.describeForm.controls.displayName.markAsTouched();
  }

  writeValue(value: { name: string; displayName: string }): void {
    this.describeForm.patchValue(value);
  }
  registerOnChange(changed: (value) => void): void {
    this.OnChange = changed;
  }
  registerOnTouched(tocuhed: () => void): void {
    this.onTouched = tocuhed;
  }
  validate() {
    if (this.describeForm.invalid) {
      return { invalid: true };
    }
    return null;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.describeForm.disable();
    } else if (this.describeForm.disabled) {
      this.describeForm.enable();
    }
  }
  getControl(name: string) {
    return this.describeForm.get(name)!;
  }
}
