import { Component } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import {
  fadeInUp400ms,
  AuthenticationService,
  unexpectedErrorMessage,
} from '@activepieces/ui/common';
import { OtpType } from '@activepieces/ee-shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

@Component({
  templateUrl: './verify-email-post-sign-up.component.html',
  animations: [fadeInUp400ms],
})
export class VerifyEmailPostSignUpComponent {
  readonly OtpType = OtpType;
  readonly verifyingEmail = $localize`Verifying Email`;
  readonly verifiedEmail = $localize`Verified Email`;
  readonly verificationFailed = $localize`Verification Failed`;
  actionTitle$: BehaviorSubject<string> = new BehaviorSubject(
    this.verifyingEmail
  );
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
    this.titleService.setTitle($localize`Verifying email`);
    this.verifyingEmail$ = this.authenticationService
      .verifyEmail({
        otp: otp,
        userId,
      })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === HttpStatusCode.Gone) {
            this.actionTitle$.next(this.verificationFailed);
            this.titleService.setTitle(this.verificationFailed);
            setTimeout(() => this.backToSignIn(), 3000);
          } else {
            this.snackbar.open(unexpectedErrorMessage, '', {
              panelClass: 'error',
            });
            this.backToSignIn();
          }

          throw err;
        }),
        tap(() => {
          this.actionTitle$.next(this.verifiedEmail);
          this.titleService.setTitle($localize`Email Verified`);
          setTimeout(() => this.backToSignIn(), 3000);
        })
      );
  }
  backToSignIn() {
    this.router.navigate(['/sign-in']);
  }
}
