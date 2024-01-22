import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { PlatformService } from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { Platform } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PLATFORM_RESOLVER_KEY } from '../../platform.resolver';

interface TermsAndServicesForm {
  privacyPolicyUrl: FormControl<string>;
  termsOfServiceUrl: FormControl<string>;
}
@Component({
  selector: 'app-terms-and-services-settings',
  templateUrl: './terms-and-services-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndServicesSettingsComponent implements OnInit {
  termsAndServicesForm: FormGroup<TermsAndServicesForm>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  saving$?: Observable<void>;
  constructor(
    private fb: FormBuilder,
    private platformService: PlatformService,
    private route: ActivatedRoute,
    private matSnackbar: MatSnackBar
  ) {
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
    const platform: Platform = this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
    this.termsAndServicesForm.patchValue(platform);
  }

  save() {
    const platform: Platform = this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
    this.termsAndServicesForm.markAllAsTouched();
    if (!this.loading$.value && !this.termsAndServicesForm.invalid) {
      this.loading$.next(true);
      this.saving$ = this.platformService
        .updatePlatform(
          {
            ...this.termsAndServicesForm.value,
          },
          platform.id
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
