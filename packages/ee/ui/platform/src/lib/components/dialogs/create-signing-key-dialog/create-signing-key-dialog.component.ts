import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { copyText } from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddSigningKeyResponse } from '@activepieces/ee-shared';
import { SigningKeysService } from '../../../service/signing-keys.service';

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
  loading$ = new BehaviorSubject(false);
  keyCreated = false;
  dialogTitle: string = $localize`Create Key`;
  confirmationControl: FormControl<boolean> = new FormControl(false, {
    nonNullable: true,
  });
  nameChanged$: Observable<string>;
  createSigningKey$?: Observable<AddSigningKeyResponse>;
  signingKeyFormControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
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
    this.nameChanged$ = this.formGroup.controls.displayName.valueChanges.pipe(
      tap((val) => {
        if (val !== '') this.formGroup.controls.displayName.setErrors(null);
      })
    );
  }
  createKey() {
    if (this.formGroup.valid && !this.loading$.value) {
      this.loading$.next(true);
      this.createSigningKey$ = this.signingKeysService
        .create({
          displayName: this.formGroup.getRawValue().displayName,
        })
        .pipe(
          tap((res) => {
            this.keyCreated = true;
            this.loading$.next(false);
            this.dialogTitle = $localize`Key Created`;
            this.signingKeyFormControl.setValue(res.privateKey);
          }),
          catchError((err) => {
            this.formGroup.controls.displayName.setErrors({ invalid: true });
            this.loading$.next(false);
            throw err;
          })
        );
    }
  }
  copyKey() {
    copyText(this.signingKeyFormControl.getRawValue());
    this.matSnakcbar.open('Copied successfully');
  }
  downloadKey() {
    const blob = new Blob([this.signingKeyFormControl.getRawValue()], {
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
