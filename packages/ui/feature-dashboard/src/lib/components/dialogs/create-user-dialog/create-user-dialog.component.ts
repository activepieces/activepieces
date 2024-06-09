import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
} from 'rxjs';

import { PlatformUserService, UiCommonModule } from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { PlatformRole } from '@activepieces/shared';
import { LottieModule } from 'ngx-lottie';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  templateUrl: './create-user-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, UiCommonModule, LottieModule],
})
export class CreateUserDialogComponent {
  readonly inviteAdminTitle = $localize`Invite Admin`;
  readonly adminCreatedTitle = $localize`Admin Created`;
  loading$ = new BehaviorSubject(false);
<<<<<<< HEAD
  readonly platformRole = PlatformRole;
=======
  readonly platformRole = PlatformRole
>>>>>>> e55ed8d468a9620d06ef82724d4274b13e0b439b
  readonly adminNote = $localize`Please note that the invited admin will have full access to all projects`;

  formGroup: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    role: FormControl<PlatformRole>;
  }>;
  createUser$?: Observable<void>;
  screenState: BehaviorSubject<'form' | 'success'>;
  constructor(
    private fb: FormBuilder,
    private clipboard: Clipboard,
    private matsnackbar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private usersService: PlatformUserService
  ) {
    this.screenState = new BehaviorSubject<'form' | 'success'>('success');
    this.formGroup = this.fb.group({
      firstName: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      lastName: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      email: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      role: this.fb.control<PlatformRole>(PlatformRole.ADMIN, {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
    this.formGroup.controls.role.disable();
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (!this.loading$.value && this.formGroup.valid) {
      const { email, firstName, lastName } = this.formGroup.value;
      this.loading$.next(true);
<<<<<<< HEAD
      this.createUser$ = this.usersService
        .createUser({
          email: email!,
          firstName: firstName!,
          lastName: lastName!,
          platformRole: PlatformRole.ADMIN,
        })
        .pipe(
          map(() => undefined),
          catchError((err) => {
            this.matsnackbar.open('Failed to create user', '', {
              duration: 2000,
            });
            console.error(err);
            return of(undefined);
          })
        );
=======
      this.createUser$ = this.usersService.createUser({
        email: email!,
        firstName: firstName!,
        lastName: lastName!,
        platformRole: PlatformRole.ADMIN,
      }).pipe(
        tap(() => {

        }),
        map(() => undefined),
        catchError((err) => {
          this.matsnackbar.open('Failed to create user', '', {
            duration: 2000,
          });
          console.error(err);
          return of(undefined)
        })
      );
>>>>>>> e55ed8d468a9620d06ef82724d4274b13e0b439b
    }
  }

  close() {
    this.dialogRef.close();
  }

  copy(text: string) {
    this.clipboard.copy(text);
    this.matsnackbar.open('Copied to clipboard', '', {
      duration: 2000,
    });
  }
<<<<<<< HEAD
=======

>>>>>>> e55ed8d468a9620d06ef82724d4274b13e0b439b
}
