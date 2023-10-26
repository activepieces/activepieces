import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { Observable } from 'rxjs';
import { copyText } from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  confirmationControl: FormControl<boolean> = new FormControl(false, {
    nonNullable: true,
  });
  createProject$?: Observable<void>;
  signingKey = `4%I':'"bM8[],3YqZ}t>8-(O?Y@*9k}A34n%N1&Jq$X>b;(p.%$laHcs}euc&2L 4%I':'"bM8[],3YqZ}t>8-(O?Y@*9k}A34n%N1&Jq$X>b;(p.%$laHcs}euc&2L`;
  signingKeyFormControl: FormControl<string> = new FormControl(
    this.signingKey,
    {
      nonNullable: true,
    }
  );
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateSigningKeyDialogComponent>,
    private matSnakcbar: MatSnackBar
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
      this.keyCreated = true;
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
