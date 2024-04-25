import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  AuthenticationService,
  ContactSalesService,
  FEATURES,
  Feature,
  FeatureKey,
} from '@activepieces/ui/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError, startWith } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-contact-sales',
  templateUrl: './contact-sales.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSalesComponent {
  sendRequest$: Observable<void> | undefined;
  updateFeatures$: Observable<void> | undefined;
  pending$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly FEATURES = FEATURES;
  contactSalesForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    domain: FormControl<string>;
    message: FormControl<string>;
    features: FormControl<FeatureKey[]>;
  }>;
  featureData$: Observable<{
    featureCount: number;
    selected: FeatureKey[];
  }> = of({
    selected: [],
    featureCount: 0,
  });

  @Output() cancel = new EventEmitter<void>();

  constructor(
    public authenticationService: AuthenticationService,
    public contactSalesService: ContactSalesService,
    private snackbar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.contactSalesForm = this.fb.group({
      domain: this.fb.control<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(
            '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'
          ),
        ],
      }),
      email: this.fb.control<string>(
        this.authenticationService.currentUser.email,
        {
          nonNullable: true,
          validators: [Validators.required, Validators.email],
        }
      ),
      name: this.fb.control<string>(
        this.authenticationService.currentUser.firstName +
          ' ' +
          this.authenticationService.currentUser.lastName,
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      message: this.fb.control<string>('', {
        nonNullable: true,
        validators: [],
      }),
      features: this.fb.control<FeatureKey[]>([], {
        nonNullable: true,
        validators: [],
      }),
    });
    this.updateFeatures$ = this.contactSalesService.selectedFeature.pipe(
      tap((features) => {
        this.contactSalesForm.controls.features.setValue(features);
      }),
      map(() => void 0)
    );
    this.featureData$ =
      this.contactSalesForm.controls.features.valueChanges.pipe(
        startWith(this.contactSalesForm.controls.features.value),
        map((features) => {
          return {
            selected: features,
            featureCount: features.length,
          };
        })
      );
  }

  hasFeature(feature: Feature) {
    return this.contactSalesForm.controls.features.value.includes(feature.key);
  }

  toggle(feature: Feature) {
    const alreadyChecked =
      this.contactSalesForm.controls.features.value.includes(feature.key);
    const newFeatures = alreadyChecked
      ? this.contactSalesForm.controls.features.value.filter(
          (f) => f !== feature.key
        )
      : [...this.contactSalesForm.controls.features.value, feature.key];
    this.contactSalesForm.controls.features.setValue(newFeatures);
  }

  closeSlideout() {
    this.contactSalesService.close();
  }

  submitForm() {
    if (!this.pending$.value) {
      this.pending$.next(true);
      const { name, email, domain, message, features } =
        this.contactSalesForm.value;
      this.sendRequest$ = this.contactSalesService
        .sendRequest({
          name: name!,
          email: email!,
          domain: domain!,
          message: message!,
          features: features!,
        })
        .pipe(
          tap((response) => {
            this.pending$.next(false);
            if (!response.status || response.status === 'success') {
              this.snackbar.open(
                "We'll get in touch soon! Your request has been sent.",
                '',
                {
                  duration: 3000,
                }
              );
            } else if (response.status === 'error') {
              const errorMessage =
                response.message ||
                'An error occurred while sending your request.';
              this.snackbar.open(errorMessage, '', {
                duration: 3000,
                panelClass: ['error'],
              });
            }
            this.closeSlideout();
          }),
          map(() => void 0),
          catchError(() => {
            this.pending$.next(false);
            this.snackbar.open(
              'Failed to send request due to a network or server error.',
              '',
              {
                duration: 3000,
                panelClass: ['error'],
              }
            );
            return of(void 0);
          })
        );
    }
  }
}
