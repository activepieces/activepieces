import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
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
  styleUrls: ['./auth-action.component.scss'],
  templateUrl: './auth-action.component.html',
  animations: [fadeInUp400ms],
})
export class AuthActionComponent {
  readonly OtpType = OtpType;
  readonly resetPasswordTitle = $localize`Reset Password`;
  readonly verifyingEmail = $localize`Verifying Email`;
  readonly verifiedEmail = $localize`Verified Email`;
  mode: OtpType;
  actionTitle = this.resetPasswordTitle;
  passwordResetActionError = '';
  resetingPassword = false;
  resetPassword$?: Observable<void>;
  verifyingEmail$?: Observable<void>;
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
    private titleService: Title,
    private authenticationService: AuthenticationService
  ) {
    this.mode = this.activatedRoute.snapshot.queryParams['mode'];
    const otp = this.activatedRoute.snapshot.queryParams['otpcode'];
    if (this.mode === OtpType.EMAIL_VERIFICATION) {
      this.actionTitle = this.verifyingEmail;
      this.titleService.setTitle($localize`Verifying email`);
      this.verifyingEmail$ = this.authenticationService
        .verifyEmail({
          otp: otp,
        })
        .pipe(
          catchError((err) => {
            console.error(err);
            this.passwordResetActionError =
              'This password reset request has been expired';
            throw err;
          }),
          tap(() => {
            this.actionTitle = this.verifiedEmail;
            this.titleService.setTitle($localize`Email Verified`);
            setTimeout(() => this.redirectToBack(), 3000);
          })
        );
    }
  }

  backToSign() {
    this.router.navigate(['/sign-in']);
  }

  handlePasswordReset() {
    if (this.newPasswordControl.valid && !this.resetingPassword) {
      this.resetingPassword = true;
    }
  }

  redirectToBack() {
    this.router.navigate(['/sign-in']);
  }
}
