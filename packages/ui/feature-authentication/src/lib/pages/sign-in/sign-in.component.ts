import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import {
  AuthenticationService,
  FlagService,
  RedirectService,
  fadeInUp400ms,
} from '@activepieces/ui/common';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { StatusCodes } from 'http-status-codes';
import { ApEdition, ApFlagId, ErrorCode } from '@activepieces/shared';
import { OtpType } from '@activepieces/ee-shared';
import { MatSnackBar } from '@angular/material/snack-bar';
interface SignInForm {
  email: FormControl<string>;
  password: FormControl<string>;
}
@Component({
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  animations: [fadeInUp400ms],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {
  loginForm: FormGroup<SignInForm>;
  showInvalidEmailOrPasswordMessage = false;
  loading = false;
  authenticate$: Observable<void> | undefined;
  isCommunityEdition$: Observable<boolean>;
  showResendVerification = false;
  sendingVerificationEmail = false;
  showDisabledUser = false;
  domainIsNotAllowed = false;
  invitationOnlySignIn = false;
  loginsWithEmailEnabled$: Observable<boolean>;
  showSignUpLink$: Observable<boolean>;
  sendVerificationEmail$?: Observable<void>;

  constructor(
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private flagsService: FlagService,
    private redirectService: RedirectService,
    private snackbar: MatSnackBar
  ) {
    this.loginsWithEmailEnabled$ = this.flagsService.isFlagEnabled(
      ApFlagId.EMAIL_AUTH_ENABLED
    );

    this.showSignUpLink$ = this.flagsService.isFlagEnabled(
      ApFlagId.SHOW_SIGN_UP_LINK
    );
    this.isCommunityEdition$ = this.flagsService
      .getEdition()
      .pipe(map((ed) => ed === ApEdition.COMMUNITY));
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  signIn(): void {
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;
      this.showInvalidEmailOrPasswordMessage = false;
      this.showResendVerification = false;
      this.invitationOnlySignIn = false;
      this.showDisabledUser = false;
      this.domainIsNotAllowed = false;
      const request = this.loginForm.getRawValue();
      this.authenticate$ = this.authenticationService.signIn(request).pipe(
        catchError((error: HttpErrorResponse) => {
          this.showInvalidEmailOrPasswordMessage =
            error.status === StatusCodes.UNAUTHORIZED ||
            error.status === StatusCodes.BAD_REQUEST;
          if (error.status === StatusCodes.FORBIDDEN) {
            this.showResendVerification =
              error.error.code === ErrorCode.EMAIL_IS_NOT_VERIFIED;
            this.showDisabledUser =
              error.error.code === ErrorCode.USER_IS_INACTIVE;
            this.domainIsNotAllowed =
              error.error.code === ErrorCode.DOMAIN_NOT_ALLOWED;
            this.invitationOnlySignIn =
              error.error.code === ErrorCode.INVITATION_ONLY_SIGN_UP;
          }

          this.loading = false;
          return of(null);
        }),
        tap((response) => {
          if (response && response.body) {
            this.authenticationService.saveUser(
              response.body,
              response.body.token
            );
            this.redirect();
          }
        }),
        map(() => void 0)
      );
    }
  }

  redirect() {
    this.redirectService.redirect();
  }

  sendVerificationEmail() {
    this.sendingVerificationEmail = true;
    this.sendVerificationEmail$ = this.authenticationService
      .sendOtpEmail({
        email: this.loginForm.getRawValue().email,
        type: OtpType.EMAIL_VERIFICATION,
      })
      .pipe(
        tap(() => {
          this.snackbar.open(
            'Verification email sent, please check your inbox'
          );
          this.sendingVerificationEmail = false;
          this.showResendVerification = false;
        })
      );
  }
}
