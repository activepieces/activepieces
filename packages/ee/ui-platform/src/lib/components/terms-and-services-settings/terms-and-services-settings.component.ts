import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { PlatformService } from '@activepieces/ui/common';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { Platform } from '@activepieces/ee-shared';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  @Input({ required: true }) platform!: Platform;
  constructor(
    private fb: FormBuilder,
    private platformService: PlatformService,

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
    this.termsAndServicesForm.patchValue(this.platform);
  }

  save() {
    this.termsAndServicesForm.markAllAsTouched();
    if (!this.loading$.value && !this.termsAndServicesForm.invalid) {
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
