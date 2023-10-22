import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { validColorValidator } from 'ngx-colors';

interface AppearanceForm {
  displayName: FormControl<string>;
  logo: FormControl<File | null>;
  favIcon: FormControl<File | null>;
  primaryColor: FormControl<string>;
  pickerCtrl: FormControl<string>;
}
@Component({
  selector: 'app-platform-appearance',
  templateUrl: './platform-appearance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformAppearanceComponent {
  formGroup: FormGroup<AppearanceForm>;
  constructor(private fb: FormBuilder) {
    this.formGroup = this.fb.group({
      displayName: this.fb.control(
        {
          disabled: false,
          value: '',
        },
        { validators: [Validators.required], nonNullable: true }
      ),
      favIcon: this.fb.control<File | null>(
        {
          disabled: false,
          value: null,
        },
        { validators: [Validators.required] }
      ),
      logo: this.fb.control<File | null>(
        {
          disabled: false,
          value: null,
        },
        { validators: [Validators.required] }
      ),
      primaryColor: this.fb.control(
        {
          disabled: false,
          value: '#6e41e2',
        },
        {
          validators: [Validators.required, validColorValidator],
          nonNullable: true,
        }
      ),
      pickerCtrl: this.fb.control(
        {
          disabled: false,
          value: '#6e41e2',
        },
        { nonNullable: true }
      ),
    });
  }
}
