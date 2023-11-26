import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { AuthenticationService, fadeInUp400ms } from '@activepieces/ui/common';
import { FlagService } from '@activepieces/ui/common';
import {
  containsSpecialCharacter,
  containsUppercaseCharacter,
  containsLowercaseCharacter,
  containsNumber,
} from '@activepieces/ui/common';
import { ApFlagId, UserStatus } from '@activepieces/shared';
import { OtpType } from '@activepieces/ee-shared';

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
  animations: [fadeInUp400ms],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
  registrationForm: FormGroup<UserInfo>;
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
  readonly OtpType = OtpType;
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    public flagService: FlagService,
    public authenticationService: AuthenticationService,
    private route: ActivatedRoute
  ) {
    this.privacyPolicyUrl$ = this.flagService.getStringFlag(
      ApFlagId.PRIVACY_POLICY_URL
    );
    this.termsOfServiceUrl$ = this.flagService.getStringFlag(
      ApFlagId.TERMS_OF_SERVICE_URL
    );
    this.registrationForm = this.formBuilder.group({
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
      newsLetter: new FormControl<boolean>(true, { nonNullable: true }),
    });
    this.signedUpEnabled$ = this.flagService.isSignedUpEnabled();

    this.emailValueChanged$ =
      this.registrationForm.controls.email.valueChanges.pipe(
        tap(() => {
          this.emailChanged = true;
        })
      );
  }

  signUp() {
    if (this.registrationForm.valid && !this.loading) {
      this.loading = true;
      const request = this.registrationForm.getRawValue();
      this.signUp$ = this.authenticationService.signUp(request).pipe(
        tap((response) => {
          if (
            response &&
            response.body &&
            response.body.token &&
            response.body.status === UserStatus.VERIFIED
          ) {
            this.authenticationService.saveToken(response.body.token);
            this.authenticationService.saveUser(response);
          }
        }),
        switchMap((response) => {
          if (this.registrationForm.controls.newsLetter.value && response) {
            return this.authenticationService
              .saveNewsLetterSubscriber(request.email)
              .pipe(
                map(() => response),
                catchError((err) => {
                  console.error(err);
                  return of(response);
                })
              );
          }
          return of(response);
        }),
        tap((response) => {
          if (response && response.body?.status === UserStatus.VERIFIED) {
            this.redirect();
          }
          this.signUpDone = true;
        }),
        catchError((err) => {
          this.emailExists = true;
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
  goBackToSign() {
    this.router.navigate(['/sign-in'], {
      queryParams: {
        redirect_url: this.route.snapshot.queryParams['redirect_url'],
      },
    });
  }

  redirect() {
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirect_url');
    if (redirectUrl) {
      this.router.navigateByUrl(decodeURIComponent(redirectUrl));
    } else {
      this.router.navigate(['/flows']);
    }
  }
}
