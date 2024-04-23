import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { UiCommonModule } from '@activepieces/ui/common';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { PlatformUserService } from '../../../service/platform-user.service';
import { PlatformRole } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';

type PlatformRoleDialog = {
  userId: string;
  platformRole: PlatformRole;
};

@Component({
  templateUrl: './edit-user-role-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatDialogModule, UiCommonModule],
})
export class EditUserDialogComponent {
  formGroup: FormGroup<{
    platformRole: FormControl<PlatformRole>;
  }>;
  loading$ = new BehaviorSubject(false);
  dialogTitle: string = $localize`Update User`;
  keyFormControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  updateRole$: Observable<void> | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: PlatformRoleDialog,
    private fb: FormBuilder,
    private matSnackbar: MatSnackBar,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    private platformUserService: PlatformUserService
  ) {
    this.formGroup = this.fb.group({
      platformRole: this.fb.control(
        {
          value: this.data.platformRole,
          disabled: false,
        },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
    });
  }
  updateUser() {
    if (this.formGroup.valid && !this.loading$.value) {
      this.loading$.next(true);
      this.updateRole$ = this.platformUserService
        .updateUser(this.data.userId, {
          platformRole: this.formGroup.getRawValue().platformRole,
        })
        .pipe(
          tap(() => {
            this.dialogRef.close(true);
            this.matSnackbar.open($localize`User role updated`, '', {
              duration: 5000,
            });
            this.loading$.next(false);
          }),
          catchError((err) => {
            this.loading$.next(false);
            this.matSnackbar.open($localize`Failed to update user role`, '', {
              duration: 5000,
              panelClass: 'error',
            });
            throw err;
          })
        );
    }
  }
  get platformRole() {
    return PlatformRole;
  }
}
