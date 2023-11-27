import { Component } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, tap } from 'rxjs';
import {
  fadeInUp400ms,
  AuthenticationService,
  unexpectedErrorMessage,
} from '@activepieces/ui/common';
import { OtpType } from '@activepieces/ee-shared';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  templateUrl: './verify-email-post-sign-up.component.html',
  animations: [fadeInUp400ms],
})
export class VerifyEmailPostSignUpComponent {
  readonly OtpType = OtpType;
  readonly verifyingEmail = $localize`Verifying Email`;
  readonly verifiedEmail = $localize`Verified Email`;
  actionTitle = this.verifyingEmail;
  errorMessage = '';
  verifyingEmail$?: Observable<void>;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private authenticationService: AuthenticationService,
    private snackbar: MatSnackBar
  ) {
    const otp = this.activatedRoute.snapshot.queryParams['otpcode'];
    const userId = this.activatedRoute.snapshot.queryParams['userId'];
    this.actionTitle = this.verifyingEmail;
    this.titleService.setTitle($localize`Verifying email`);
    this.verifyingEmail$ = this.authenticationService
      .verifyEmail({
        otp: otp,
        userId,
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.snackbar.open(unexpectedErrorMessage, '', {
            panelClass: 'error',
          });
          throw err;
        }),
        tap(() => {
          this.actionTitle = this.verifiedEmail;
          this.titleService.setTitle($localize`Email Verified`);
          setTimeout(() => this.backToSignIn(), 3000);
        })
      );
  }
  backToSignIn() {
    this.router.navigate(['/sign-in']);
  }
}
