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
import { ApiKeyResponseWithValue } from '@activepieces/ee-shared';
import { ApiKeysService } from '../../../service/api-keys.service';

interface CreateApiKeyForm {
  displayName: FormControl<string>;
}
@Component({
  selector: 'app-create-api-key-dialog',
  templateUrl: './create-api-key-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateApiKeyDialogComponent {
  formGroup: FormGroup<CreateApiKeyForm>;
  loading$ = new BehaviorSubject(false);
  keyCreated = false;
  dialogTitle: string = $localize`Create Key`;
  nameChanged$: Observable<string>;
  createApiKey$?: Observable<ApiKeyResponseWithValue>;
  keyFormControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateApiKeyDialogComponent>,
    private matSnakcbar: MatSnackBar,
    private apiKeysService: ApiKeysService
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
      this.createApiKey$ = this.apiKeysService
        .create({
          displayName: this.formGroup.getRawValue().displayName,
        })
        .pipe(
          tap((res) => {
            this.keyCreated = true;
            this.loading$.next(false);
            this.dialogTitle = $localize`Key Created`;
            this.keyFormControl.setValue(res.value);
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
    copyText(this.keyFormControl.getRawValue());
    this.matSnakcbar.open('Copied successfully');
  }

  close() {
    this.dialogRef.close(true);
  }
}
