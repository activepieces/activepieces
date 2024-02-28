import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Platform, ApEdition } from '@activepieces/shared';
import { PlatformService } from '@activepieces/ui/common';

@Component({
  selector: 'app-add-allowed-email-domain-dialog',
  templateUrl: './add-allowed-email-domain-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAllowedEmailDomainDialogComponent {
  readonly ApEdition = ApEdition;
  readonly title = $localize`Add Allowed Email Domain`;
  loading$ = new BehaviorSubject(false);
  addAllowedDomain$?: Observable<void>;
  formGroup: FormGroup<{
    domain: FormControl<string>;
  }>;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddAllowedEmailDomainDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { platform: Platform },
    private platformService: PlatformService
  ) {
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
      const platform: Platform = JSON.parse(JSON.stringify(this.data.platform));
      platform.allowedAuthDomains.push(this.formGroup.getRawValue().domain);
      this.addAllowedDomain$ = this.platformService
        .updatePlatform(
          {
            enforceAllowedAuthDomains: true,
            allowedAuthDomains: platform.allowedAuthDomains,
          },
          platform.id
        )
        .pipe(tap(() => this.dialogRef.close(this.formGroup.value.domain)));
    }
  }
}
