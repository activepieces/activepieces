import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, tap } from 'rxjs';

import {
  containsSpecialCharacter,
  fadeInUp400ms,
  containsLowercaseCharacter,
  containsUppercaseCharacter,
  containsNumber,
  AuthenticationService,
} from '@activepieces/ui/common';
import { OtpType } from '@activepieces/ee-shared';

@Component({
  styleUrls: ['./reset-password.component.scss'],
  templateUrl: './reset-password.component.html',
  animations: [fadeInUp400ms],
})
export class ResetPasswordComponent {
  readonly OtpType = OtpType;
  readonly resetPasswordTitle = $localize`Reset Password`;
  actionTitle = this.resetPasswordTitle;
  passwordResetActionError = '';
  resetingPassword = false;
  resetPassword$?: Observable<void>;
  newPasswordControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(64),
      containsSpecialCharacter(),
      containsUppercaseCharacter(),
      containsLowercaseCharacter(),
      containsNumber(),
    ],
  });
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authenticationService: AuthenticationService
  ) {}

  handlePasswordReset() {
    if (this.newPasswordControl.valid && !this.resetingPassword) {
      this.resetingPassword = true;
      const otp = this.activatedRoute.snapshot.queryParams['otpcode'];
      this.resetPassword$ = this.authenticationService
        .resetPassword({
          otp,
          newPassword: this.newPasswordControl.value,
        })
        .pipe(
          catchError((err) => {
            this.passwordResetActionError = $localize`Your password reset request has expired, please request a new one`;
            console.error(err);
            throw err;
          }),
          tap(() => this.redirectToBack())
        );
    }
  }

  redirectToBack() {
    this.router.navigate(['/sign-in']);
  }
}
