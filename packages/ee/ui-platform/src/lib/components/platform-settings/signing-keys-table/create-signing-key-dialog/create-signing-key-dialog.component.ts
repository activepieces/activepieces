import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { Observable, tap } from 'rxjs';
import { copyText } from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SigningKeysService } from '@activepieces/ee-components';

interface CreateSigningKeyForm {
  displayName: FormControl<string>;
}
@Component({
  selector: 'app-create-signing-key-dialog',
  templateUrl: './create-signing-key-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSigningKeyDialogComponent {
  formGroup: FormGroup<CreateSigningKeyForm>;
  loading = false;
  keyCreated = false;
  dialogTitle: string = $localize`Create Key`;
  confirmationControl: FormControl<boolean> = new FormControl(false, {
    nonNullable: true,
  });
  createProject$?: Observable<void>;
  signingKey = ``;
  createSigningKey$?: Observable<string>;
  signingKeyFormControl: FormControl<string> = new FormControl(
    this.signingKey,
    {
      nonNullable: true,
    }
  );
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateSigningKeyDialogComponent>,
    private matSnakcbar: MatSnackBar,
    private signingKeysService: SigningKeysService
  ) {
    this.formGroup = this.fb.group({
      displayName: this.fb.control(
        {
          value: '',
          disabled: false,
        },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
    });
  }
  createKey() {
    //Create key logic
    if (this.formGroup.valid && !this.loading) {
      this.createSigningKey$ = this.signingKeysService
        .create({
          displayName: this.formGroup.getRawValue().displayName,
        })
        .pipe(
          tap((res) => {
            this.keyCreated = true;
            this.dialogTitle = $localize`Key Created`;
            this.signingKey = res;
          })
        );
    }
  }
  copyKey() {
    copyText(this.signingKey);
    this.matSnakcbar.open('Copied successfully');
  }
  downloadKey() {
    const blob = new Blob([this.signingKey], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.formGroup.getRawValue().displayName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  close() {
    this.dialogRef.close(true);
  }
}
