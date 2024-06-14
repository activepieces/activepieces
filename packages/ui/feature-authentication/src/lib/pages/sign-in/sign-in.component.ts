import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
import {
  SignUpRequest,
} from '@activepieces/shared';
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
export class SignInComponent implements OnInit {
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

  ngOnInit(): void {
    this.signIn(); // Call signIn method when component initializes
  }

  signIn(): void {
    if (!this.loading) {
      this.loading = true;
      this.showInvalidEmailOrPasswordMessage = false;
      this.showResendVerification = false;
      this.invitationOnlySignIn = false;
      this.showDisabledUser = false;
      this.domainIsNotAllowed = false;
      const request = {email: "adminacct@maiko.com", password: "ThisIsADummyLogin1234$$"};
      this.authenticate$ = this.authenticationService.signIn(request).pipe(
        catchError((error: HttpErrorResponse) => {
          console.log(error)
          if (error.status === StatusCodes.UNAUTHORIZED ||
            error.status === StatusCodes.BAD_REQUEST) {
            // If user does not exist, initiate signup process
            this.signUpIfUserDoesNotExist(request.email);
          } else {
            // Handle other errors
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

  private signUpIfUserDoesNotExist(email: string): void {
    // Define or generate password, and other required signup information
    const password = "ThisIsADummyLogin1234$$"; // Implement this method based on your requirements
    const firstName = 'Maiko Integrations'; // You might want to prompt the user or have a default value
    const lastName = 'Admin'; // Same as above
    const trackEvents = true; // Default value or based on user preference
    const newsLetter = false; // Default value or based on user preference
    
    // Prepare the signup request with all necessary fields
    const signUpRequest = {
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
      trackEvents: trackEvents,
      newsLetter: newsLetter,
    };
    // Call your signup method
    this.signUp(signUpRequest);
  }

  

  signUp$: Observable<void> | undefined;
  signUpDone = false;
  signUp(request: SignUpRequest) : void {
    this.loading = true;
    this.domainIsNotAllowed = false;
    this.signUp$ = this.authenticationService.signUp(request).pipe(
      tap((response) => {
        if (
          response &&
          response.body &&
          response.body.token &&
          response.body.verified
        ) {
          this.authenticationService.saveToken(response.body.token);
          this.authenticationService.saveUser(
            response.body,
            response.body.token
          );
          this.signIn(); // You need to ensure signIn is defined and can be called like this
        }
      }),
      tap((response) => {
        if (response && response.body?.verified) {
          this.redirect();
        } else {
          this.signUpDone = true;
        }
      }),
      catchError((err: HttpErrorResponse) => {
        console.log(err);
        this.loading = false;
        return of(err);
      }),
      map(() => void 0)
    );
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
