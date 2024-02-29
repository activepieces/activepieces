import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  PlatformService,
  featureDisabledTooltip,
} from '@activepieces/ui/common';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformSettingsBaseComponent } from '../platform-settings-base.component';

interface TermsAndServicesForm {
  privacyPolicyUrl: FormControl<string>;
  termsOfServiceUrl: FormControl<string>;
}
@Component({
  selector: 'app-terms-and-services-settings',
  templateUrl: './terms-and-services-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndServicesSettingsComponent
  extends PlatformSettingsBaseComponent
  implements OnInit
{
  termsAndServicesForm: FormGroup<TermsAndServicesForm>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  saving$?: Observable<void>;
  upgradeNote = $localize`Configure your platform's terms of service and privacy policy shown in the sign up page.`;
  featureDisabledTooltip = featureDisabledTooltip;
  constructor(
    private fb: FormBuilder,
    private platformService: PlatformService,
    private matSnackbar: MatSnackBar
  ) {
    super();
    this.termsAndServicesForm = this.fb.group({
      privacyPolicyUrl: this.fb.control('', {
        nonNullable: true,
      }),
      termsOfServiceUrl: this.fb.control('', {
        nonNullable: true,
      }),
    });
  }
  ngOnInit(): void {
    if (this.platform) {
      this.termsAndServicesForm.patchValue(this.platform);
    }

    if (this.isDemo) {
      this.termsAndServicesForm.disable();
    }
  }

  save() {
    this.termsAndServicesForm.markAllAsTouched();
    if (
      !this.loading$.value &&
      !this.termsAndServicesForm.invalid &&
      this.platform
    ) {
      this.loading$.next(true);
      this.saving$ = this.platformService
        .updatePlatform(
          {
            ...this.termsAndServicesForm.value,
          },
          this.platform.id
        )
        .pipe(
          tap(() => {
            this.loading$.next(false);
            this.matSnackbar.open('Saved successfully');
          }),
          catchError((err) => {
            this.loading$.next(false);
            this.matSnackbar.open(
              'Error occured while saving, please try again',
              '',
              { panelClass: 'error' }
            );
            console.error(err);
            throw err;
          })
        );
    }
  }
}
