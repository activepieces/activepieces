import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Platform, ThirdPartyAuthnProviderEnum } from '@activepieces/shared';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { FlagService, PlatformService } from '@activepieces/ui/common';
export type EnableFederatedAuthnProviderDialogData = {
  platform: Platform;
  provider: ThirdPartyAuthnProviderEnum;
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
  redirectUrl$: Observable<string>;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EnableFederatedAuthnProviderDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    private data: EnableFederatedAuthnProviderDialogData,
    private platformService: PlatformService,
    private flagService: FlagService
  ) {
    this.redirectUrl$ = this.flagService
      .getStringFlag(ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL)
      .pipe(
        map((redirectUrl) => {
          return $localize`
          **Setup Instructions**:\n
          Please check the following documentation: [SAML SSO](https://activepieces.com/docs/security/sso)\
          
          **Redirect URL**:
          \`\`\`text
          ${redirectUrl}
          \`\`\`
          `;
        })
      );

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
      if (this.data.provider === ThirdPartyAuthnProviderEnum.GITHUB) {
        platform.federatedAuthProviders.github = formData;
      }
      if (this.data.provider === ThirdPartyAuthnProviderEnum.GOOGLE) {
        platform.federatedAuthProviders.google = formData;
      }
      this.enableProvider$ = this.platformService
        .updatePlatform(
          { federatedAuthProviders: platform.federatedAuthProviders },
          platform.id
        )
        .pipe(
          tap(() => {
            this.dialogRef.close(platform);
          })
        );
    }
  }
}
