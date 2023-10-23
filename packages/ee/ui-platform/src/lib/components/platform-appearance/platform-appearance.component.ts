import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { validColorValidator } from 'ngx-colors';
import { validateFileControl } from '@activepieces/ui/common';

interface AppearanceForm {
  displayName: FormControl<string>;
  logo: FormControl<File | null>;
  fullLogo: FormControl<File | null>;
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
  logoFileExtensions: string[] = ['.png', '.jpeg', '.jpg', '.svg', '.webp'];
  formGroup: FormGroup<AppearanceForm>;
  loading = false;
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
        {
          validators: [
            Validators.required,
            validateFileControl(this.logoFileExtensions, 4000000),
          ],
        }
      ),
      fullLogo: this.fb.control<File | null>(
        {
          disabled: false,
          value: null,
        },
        {
          validators: [
            Validators.required,
            validateFileControl(this.logoFileExtensions, 4000000),
          ],
        }
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
  save() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid && !this.loading) {
      if (!this.formGroup.value.favIcon) {
        console.error('favIcon is null');
        return;
      }
      if (!this.formGroup.value.logo) {
        console.error('logo is null');
        return;
      }
      if (!this.formGroup.value.fullLogo) {
        console.error('full logo is null');
        return;
      }
      this.loading = true;
      const filesToRead: Record<string, { file: File; value: string }> = {
        logo: {
          file: this.formGroup.value.logo,
          value: '',
        },
        favIcon: {
          file: this.formGroup.value.favIcon,
          value: '',
        },
        fullLogo: {
          file: this.formGroup.value.fullLogo,
          value: '',
        },
      };
      Object.keys(filesToRead).forEach((k) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(filesToRead[k].file);
        fileReader.onload = () => {
          if (typeof fileReader.result === 'string') {
            filesToRead[k].value = fileReader.result;
            if (filesToRead['logo'].value && filesToRead['favIcon'].value) {
              this._saveRequest({
                logo: filesToRead['logo'].value,
                favIcon: filesToRead['favIcon'].value,
              });
            }
          }
        };
      });
    }
  }
  private _saveRequest(filesRead: { logo: string; favIcon: string }) {
    const req = {
      ...this.formGroup.value,
      ...filesRead,
    };
    console.log(req);
  }
}
