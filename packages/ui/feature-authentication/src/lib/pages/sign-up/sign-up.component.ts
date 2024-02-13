import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import {
  AuthenticationService,
  RedirectService,
} from '@activepieces/ui/common';
import { FlagService } from '@activepieces/ui/common';
import {
  containsSpecialCharacter,
  containsUppercaseCharacter,
  containsLowercaseCharacter,
  containsNumber,
} from '@activepieces/ui/common';
import {
  ApEdition,
  ApFlagId,
  ErrorCode,
  SignUpRequest,
} from '@activepieces/shared';
import { OtpType } from '@activepieces/ee-shared';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';

export interface UserInfo {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  trackEvents: FormControl<boolean>;
  newsLetter: FormControl<boolean>;
}
@Component({
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent implements OnInit {
  registrationForm: FormGroup<UserInfo>;
  readonly emailIsUsedErrorName = 'emailIsUsed';
  loading = false;
  tokenError = false;
  emailExists = false;
  emailChanged = false;
  emailValueChanged$: Observable<string>;
  signUp$: Observable<void> | undefined;
  signedUpEnabled$: Observable<boolean>;
  privacyPolicyUrl$: Observable<string>;
  termsOfServiceUrl$: Observable<string>;
  signUpDone = false;
  invitationOnlySignup = false;
  domainIsNotAllowed = false;
  showNewsLetterCheckbox$: Observable<boolean>;
  emailLoginsEnabled$: Observable<boolean>;
  readonly OtpType = OtpType;
  constructor(
    private formBuilder: FormBuilder,
    public flagService: FlagService,
    public authenticationService: AuthenticationService,
    private redirectService: RedirectService,
    private router: Router,
    private activeRoute: ActivatedRoute
  ) {
    this.emailLoginsEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.EMAIL_AUTH_ENABLED
    );
    this.privacyPolicyUrl$ = this.flagService.getStringFlag(
      ApFlagId.PRIVACY_POLICY_URL
    );
    this.termsOfServiceUrl$ = this.flagService.getStringFlag(
      ApFlagId.TERMS_OF_SERVICE_URL
    );
    this.showNewsLetterCheckbox$ = this.getShowNewsLetterCheckbox$();
    this.registrationForm = this.buildForm();
    this.signedUpEnabled$ = this.flagService.isSignedUpEnabled();
    this.emailValueChanged$ = this.getEmailInputListener$();
  }
  ngOnInit(): void {
    const email = this.activeRoute.snapshot.queryParamMap.get('email');
    if (email) {
      this.registrationForm.controls.email.setValue(email);
    }
  }

  signUp() {
    if (this.registrationForm.valid && !this.loading) {
      this.loading = true;
      const referringUserId =
        this.activeRoute.snapshot.queryParamMap.get('referral') ?? undefined;
      const request: SignUpRequest = {
        ...this.registrationForm.getRawValue(),
        referringUserId,
      };
      this.invitationOnlySignup = false;
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
          const emailExists = err.status === HttpStatusCode.Conflict;
          if (emailExists) {
            this.registrationForm.controls.email.setErrors({
              ...this.registrationForm.controls.email.errors,
              [this.emailIsUsedErrorName]: true,
            });
          }
          this.invitationOnlySignup = err.status === HttpStatusCode.Forbidden;
          if (err.status === StatusCodes.FORBIDDEN) {
            this.invitationOnlySignup =
              err.error.code === ErrorCode.INVITATION_ONLY_SIGN_UP;
            this.domainIsNotAllowed =
              err.error.code === ErrorCode.DOMAIN_NOT_ALLOWED;
          }
          this.emailChanged = false;
          this.loading = false;
          return of(err);
        }),
        map(() => void 0)
      );
    }
  }

  getPasswordError(errorName: string) {
    return this.registrationForm.get('password')?.hasError(errorName);
  }

  isPasswordInputIsFocused(passwordInputElement: HTMLInputElement) {
    return passwordInputElement == document.activeElement;
  }
  goBackToSignIn() {
    this.router.navigate(['/sign-in']);
  }
  redirect() {
    this.redirectService.redirect();
  }
  private getShowNewsLetterCheckbox$() {
    return this.flagService.getEdition().pipe(
      switchMap((ed) => {
        return this.flagService.getWebsiteName().pipe(
          map((name) => {
            switch (ed) {
              case ApEdition.CLOUD: {
                if (
                  typeof name === 'string' &&
                  name.toLowerCase() === 'activepieces'
                ) {
                  this.registrationForm.controls.newsLetter.setValue(true);
                }
                return false;
              }
              case ApEdition.COMMUNITY: {
                this.registrationForm.controls.newsLetter.setValue(true);
                return true;
              }
              case ApEdition.ENTERPRISE:
                return false;
            }
          })
        );
      })
    );
  }

  private buildForm() {
    return this.formBuilder.group({
      firstName: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      lastName: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      email: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.email,
          Validators.pattern('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'),
          Validators.required,
        ],
      }),
      password: new FormControl<string>('', {
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
      }),
      trackEvents: new FormControl<boolean>(true, { nonNullable: true }),
      newsLetter: new FormControl<boolean>(false, { nonNullable: true }),
    });
  }
  private getEmailInputListener$() {
    return this.registrationForm.controls.email.valueChanges.pipe(
      tap(() => {
        const errors = this.registrationForm.controls.email.errors;
        if (errors && errors[this.emailIsUsedErrorName]) {
          delete errors[this.emailIsUsedErrorName];
        }
        this.registrationForm.controls.email.setErrors(errors);
      })
    );
  }
}
