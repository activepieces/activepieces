import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { catchError, map, Observable, of, tap } from 'rxjs';
import {
  AuthenticationService,
  unexpectedErrorMessage,
} from '@activepieces/ui/common';
import { OtpType } from '@activepieces/ee-shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpStatusCode } from 'axios';
import { Router } from '@angular/router';

@Component({
  templateUrl: './forgot-password.component.html',
  styleUrls: [],
})
export class ForgotPasswordComponent {
  loading = false;
  readonly OtpType = OtpType;
  showVerificationNote = false;
  emailFormControl: FormControl<string>;
  sendPasswordReset$!: Observable<void>;
  readonly notFoundErrorName = 'notFound';
  emailChanged$?: Observable<string>;
  constructor(
    private authService: AuthenticationService,
    private matSnackbar: MatSnackBar,
    private router: Router
  ) {
    this.emailFormControl = new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.required],
    });
    this.emailFormControl.valueChanges.pipe(
      tap(() => {
        const errors = this.emailFormControl.errors;
        if (errors && errors[this.notFoundErrorName]) {
          this.emailFormControl.setErrors(null);
        }
      })
    );
  }

  sendPasswordReset() {
    if (!this.loading && !this.emailFormControl.invalid) {
      this.loading = true;
      this.sendPasswordReset$ = this.authService
        .sendOtpEmail({
          email: this.emailFormControl.value,
          type: OtpType.PASSWORD_RESET,
        })
        .pipe(
          tap(() => {
            this.loading = false;
            this.showVerificationNote = true;
          }),
          catchError((error: HttpErrorResponse) => {
            console.error(error);
            if (error.status === HttpStatusCode.NotFound) {
              this.emailFormControl.setErrors({
                [this.notFoundErrorName]: true,
              });
            } else {
              this.matSnackbar.open(unexpectedErrorMessage, '', {
                panelClass: 'error',
              });
            }
            this.loading = false;
            return of(void 0);
          }),
          map(() => void 0)
        );
    }
  }
  goBackToSignIn() {
    this.router.navigate(['/sign-in']);
  }
}
