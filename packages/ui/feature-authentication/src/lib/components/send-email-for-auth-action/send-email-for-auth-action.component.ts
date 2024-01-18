import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, tap } from 'rxjs';
import {
  AuthenticationService,
  unexpectedErrorMessage,
} from '@activepieces/ui/common';
import { OtpType } from '@activepieces/ee-shared';
@Component({
  templateUrl: './send-email-for-auth-action.component.html',
  styleUrls: [],
  selector: 'app-send-email-for-auth-action',
})
export class SendEmailForAuthActionComponent implements OnInit {
  @Input({ required: true }) email = '';
  @Input({ required: true }) otpType: OtpType = OtpType.EMAIL_VERIFICATION;
  readonly OtpType = OtpType;
  loading = false;
  resendVerification$!: Observable<void>;
  sendPasswordReset$!: Observable<void>;
  actionNote = '';
  constructor(
    private authService: AuthenticationService,
    private snackbarService: MatSnackBar
  ) {}
  ngOnInit(): void {
    this.actionNote =
      this.otpType === OtpType.EMAIL_VERIFICATION
        ? $localize`We sent you a link to complete your registration, check your email.`
        : $localize`We sent you a link to reset your password, check your email.`;
  }

  resendVerification() {
    if (!this.loading) {
      this.loading = true;
      this.resendVerification$ = this.authService
        .sendOtpEmail({
          email: this.email,
          type: OtpType.EMAIL_VERIFICATION,
        })
        .pipe(
          map(() => void 0),
          catchError((err) => {
            this.snackbarService.open(unexpectedErrorMessage, '', {
              panelClass: 'error',
            });
            console.error(err);
            throw err;
          }),
          tap(() => {
            this.snackbarService.open($localize`Verification resent`);
            this.loading = false;
          })
        );
    }
  }
  sendPasswordReset() {
    if (!this.loading) {
      this.loading = true;
      this.sendPasswordReset$ = this.authService
        .sendOtpEmail({
          email: this.email,
          type: OtpType.PASSWORD_RESET,
        })
        .pipe(
          map(() => void 0),
          catchError((err) => {
            this.snackbarService.open(unexpectedErrorMessage, '', {
              panelClass: 'error',
            });
            console.error(err);
            throw err;
          }),
          tap(() => {
            this.snackbarService.open($localize`Password reset link resent`);
            this.loading = false;
          })
        );
    }
  }
}
