import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';

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
  resettingPassword = false;
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
    if (this.newPasswordControl.valid && !this.resettingPassword) {
      this.resettingPassword = true;
      const otp = this.activatedRoute.snapshot.queryParams['otpcode'];
      const userId = this.activatedRoute.snapshot.queryParams['userId'];
      this.resetPassword$ = this.authenticationService
        .resetPassword({
          otp,
          newPassword: this.newPasswordControl.value,
          userId,
        })
        .pipe(
          tap(() => this.router.navigate(['/sign-in'])),
          catchError((err) => {
            this.passwordResetActionError = $localize`Your password reset request has expired, please request a new one`;
            this.resettingPassword = false;
            console.error(err);
            return of(void 0);
          })
        );
    }
  }
}
