import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContactSalesService,
  featuresNames,
} from '../../service/contact-sales.service';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ApEdition } from '@activepieces/shared';
import { AuthenticationService, FlagService } from '../../service';

@Component({
  selector: 'ap-contact-sales',
  templateUrl: './contact-sales.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSalesComponent {
  sendRequest$: Observable<void> | undefined;
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
  contactSalesForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    companyName: FormControl<string>;
    employeesNumber: FormControl<string>;
    goal: FormControl<string>;
  }>;

  constructor(
    public authenticationService: AuthenticationService,
    public contactSalesService: ContactSalesService,
    private fb: FormBuilder,
    private flagService: FlagService
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
      name: this.fb.control<string>(
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
      employeesNumber: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  closeSlideout() {
    this.contactSalesService.close();
  }

  submitForm() {
    if (this.contactSalesForm.valid) {
      this.loading$.next(true);
      this.sendRequest$ = this.flagService.getEdition().pipe(
        switchMap((edition) => {
          if (edition === ApEdition.CLOUD) {
            //just send the request to the flow.
          }

          //send the request to both flow and secrets-manager through our backend.
          return of(void 0);
        })
      );
    }
  }
}
