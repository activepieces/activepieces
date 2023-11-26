import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { catchError, map, Observable, tap } from 'rxjs';
// import { ActivatedRoute } from '@angular/router';
import {
  AuthenticationService,
  unexpectedErrorMessage,
} from '@activepieces/ui/common';
import { OtpType } from '@activepieces/ee-shared';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  constructor(
    // private activatedRoute: ActivatedRoute,
    private authService: AuthenticationService,
    private matSnackbar: MatSnackBar
  ) {
    this.emailFormControl = new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.required],
    });
  }

  sendPasswordReset() {
    if (!this.loading && !this.emailFormControl.invalid) {
      this.loading = true;
      //   const redirectUrl =
      //     this.activatedRoute.snapshot.queryParams['redirect_url'];
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
          catchError((error) => {
            console.error(error);
            this.matSnackbar.open(unexpectedErrorMessage, '', {
              panelClass: 'error',
            });
            throw error;
          }),
          map(() => void 0)
        );
    }
  }
}
