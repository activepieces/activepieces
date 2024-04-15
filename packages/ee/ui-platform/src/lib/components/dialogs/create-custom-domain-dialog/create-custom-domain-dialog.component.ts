import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { CustomDomainService } from '../../../service/custom-domain.service';
import { CustomDomain } from '@activepieces/ee-shared';
import { FlagService } from '@activepieces/ui/common';
import { ApEdition } from '@activepieces/shared';

@Component({
  selector: 'app-create-custom-domain-dialog',
  templateUrl: './create-custom-domain-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCustomDomainDialogComponent {
  readonly ApEdition = ApEdition;
  readonly title = $localize`Add Custom Domain`;
  readonly cloudNote = $localize`Please contact support for DNS configuration and domain verification.`;
  loading$ = new BehaviorSubject(false);
  addCustomDomain$?: Observable<CustomDomain>;
  formGroup: FormGroup<{
    domain: FormControl<string>;
  }>;
  edition$: Observable<string>;
  constructor(
    private fb: FormBuilder,
    private customDomainService: CustomDomainService,
    private dialogRef: MatDialogRef<CreateCustomDomainDialogComponent>,
    private flagService: FlagService
  ) {
    this.edition$ = this.flagService.getEdition();
    this.formGroup = this.fb.group({
      domain: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (!this.loading$.value && this.formGroup.valid) {
      this.loading$.next(true);
      const rawData = this.formGroup.getRawValue();
      this.addCustomDomain$ = this.customDomainService
        .create({
          domain: rawData.domain,
          ssl: {
            // test params
            bundleMethod: 'ubiquitous',
            certificateAuthority: 'google',
            customCertificate: 'jebkvdbf',
            customKey: 'ejbjbv',
            method: 'http',
          },
        })
        .pipe(
          tap(() => {
            this.loading$.next(false);
            this.dialogRef.close(true);
          }),
          catchError((err) => {
            this.loading$.next(false);
            console.error(err);
            throw err;
          })
        );
    }
  }
}
