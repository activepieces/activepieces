import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContactSalesService,
  featuresNames,
} from '../../service/contact-sales.service';
import {
  BehaviorSubject,
  Observable,
  catchError,
  forkJoin,
  switchMap,
  tap,
} from 'rxjs';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ApEdition, ErrorCode } from '@activepieces/shared';
import {
  AuthenticationService,
  FlagService,
  LicenseKeysService,
} from '../../service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'ap-contact-sales',
  templateUrl: './contact-sales.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSalesComponent {
  readonly ErrorCode = ErrorCode;
  sendRequest$: Observable<unknown> | undefined;
  logos = [
    'https://www.activepieces.com/logos/alan.svg',
    'https://www.activepieces.com/logos/contentful.svg',
    'https://www.activepieces.com/logos/plivo.svg',
    'https://www.activepieces.com/logos/clickup.svg',
  ];
  goals = [
    {
      displayName: $localize`Internal automations in my company`,
      telemetryValue: 'Use Activepieces internally in our company',
    },

    {
      displayName: $localize`Embed Activepieces in our SaaS product`,
      telemetryValue: 'Embed Activepieces in our SaaS product',
    },
    {
      displayName: $localize`Resell Activepieces to clients`,
      telemetryValue: `Use Activepieces with our agency's clients`,
    },
  ];
  numberOfEmployeesOptions = [
    '1,000+',
    '501 - 1000',
    '101 - 500',
    '51 - 100',
    '1 - 50',
  ];
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly featuresNames = featuresNames;
  emailValueChanged$: Observable<string>;
  contactSalesForm: FormGroup<{
    fullName: FormControl<string>;
    email: FormControl<string>;
    companyName: FormControl<string>;
    numberOfEmployees: FormControl<string>;
    goal: FormControl<string>;
  }>;

  constructor(
    public authenticationService: AuthenticationService,
    public contactSalesService: ContactSalesService,
    private fb: FormBuilder,
    private flagService: FlagService,
    private licenseKeysService: LicenseKeysService,
    private snackbar: MatSnackBar
  ) {
    this.contactSalesForm = this.fb.group({
      companyName: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      email: this.fb.control<string>(
        this.authenticationService.currentUser.email,
        {
          nonNullable: true,
          validators: [Validators.required, Validators.email],
        }
      ),
      fullName: this.fb.control<string>(
        this.authenticationService.currentUser.firstName +
        ' ' +
        this.authenticationService.currentUser.lastName,
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      goal: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      numberOfEmployees: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
    this.emailValueChanged$ = this.createListenerToRemoveServerErrorOnChange(
      this.contactSalesForm.controls.email,
      ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY
    );
  }

  closeSlideout() {
    this.contactSalesService.close();
  }

  submitForm() {
    if (!this.contactSalesForm.valid) {
      return;
    }
    this.loading$.next(true);
    this.sendRequest$ = this.flagService.getEdition().pipe(
      switchMap((edition) => {
        switch (edition) {
          case ApEdition.CLOUD:
            return this.contactSales(true);
          case ApEdition.ENTERPRISE:
          case ApEdition.COMMUNITY: {
            return forkJoin([this.requestKey(), this.contactSales(false)]);
          }
        }
      }),
      tap(() => {
        this.closeSlideout();
      })
    );
  }

  contactSales(notify: boolean) {
    return this.contactSalesService
      .sendRequest(this.contactSalesForm.getRawValue())
      .pipe(
        tap(() => {
          if (notify) {
            this.snackbar.open(
              $localize`Our sales team will be in contact with you soon.`,
              '',
              {
                duration: 5000,
              }
            );
          }
        })
      );
  }

  requestKey() {
    return this.licenseKeysService
      .createKey(this.contactSalesForm.getRawValue())
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.error?.code === ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY) {
            this.contactSalesForm.controls.email.setErrors({
              [ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY]: true,
            });
          } else {
            this.snackbar.open(
              $localize`Unexpected error please contact support on community.activepieces.com`
            );
          }
          this.loading$.next(false);
          throw err;
        }),
        tap(() => {
          this.snackbar.open(
            $localize`Please check your email for your trial key and further instructions.`,
            '',
            {
              duration: 5000,
            }
          );
        })
      );
  }

  createListenerToRemoveServerErrorOnChange<T>(
    control: FormControl<T>,
    ...errorsNames: string[]
  ): Observable<T> {
    return control.valueChanges.pipe(
      tap(() => {
        const errors = control.errors;
        errorsNames.forEach((errorName) => {
          const doErrorsContainServerError =
            errors && errors[errorName] !== undefined;
          if (doErrorsContainServerError) {
            if (Object.keys(errors).length > 1) {
              errors[errorName] = undefined;
              control.setErrors({
                ...errors,
              });
            } else {
              control.setErrors(null);
            }
          }
        });
      })
    );
  }
}
