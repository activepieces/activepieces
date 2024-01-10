import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Platform } from '@activepieces/ee-shared';
import { ApEdition } from '@activepieces/shared';
import { PlatformService } from '@activepieces/ui/common';
import { FederatedAuthnProviderEnum } from '../../sso-settings/federated-authn-provider.enum';
export type EnableFederatedAuthnProviderDialogData = {
  platform: Platform;
  provider: FederatedAuthnProviderEnum;
};

@Component({
  selector: 'app-enable-federated-authn-provider-dialog',
  templateUrl: './enable-federated-authn-provider-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnableFederatedAuthnProviderDialogComponent {
  readonly ApEdition = ApEdition;
  readonly title: string = '';
  loading$ = new BehaviorSubject(false);
  enableProvider$?: Observable<void>;
  formGroup: FormGroup<{
    clientId: FormControl<string>;
    clientSecret: FormControl<string>;
  }>;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EnableFederatedAuthnProviderDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    private data: EnableFederatedAuthnProviderDialogData,
    private platformService: PlatformService
  ) {
    this.formGroup = this.fb.group({
      clientId: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      clientSecret: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
    this.title = $localize`${this.data.provider} SSO`;
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (!this.loading$.value && this.formGroup.valid) {
      this.loading$.next(true);
      const platform: Platform = JSON.parse(JSON.stringify(this.data.platform));
      const formData = this.formGroup.getRawValue();
      if (this.data.provider === 'Github') {
        platform.federatedAuthProviders.github = formData;
      }
      if (this.data.provider === 'Google') {
        platform.federatedAuthProviders.google = formData;
      }
      this.enableProvider$ = this.platformService
        .updatePlatform(platform, platform.id)
        .pipe(
          tap(() => {
            this.dialogRef.close(platform);
          })
        );
    }
  }
}
