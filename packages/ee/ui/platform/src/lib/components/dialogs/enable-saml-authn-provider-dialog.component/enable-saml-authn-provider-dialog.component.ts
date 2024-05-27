import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Platform } from '@activepieces/shared';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { FlagService, PlatformService } from '@activepieces/ui/common';
export type EnableFederatedAuthnProviderDialogData = {
  platform: Platform;
};

@Component({
  selector: 'app-enable-saml-authn-provider-dialog',
  templateUrl: './enable-saml-authn-provider-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnableSAMLAuthnProviderDialogComponent {
  readonly ApEdition = ApEdition;
  readonly title: string = '';
  loading$ = new BehaviorSubject(false);
  enableProvider$?: Observable<void>;
  formGroup: FormGroup<{
    idpMetadata: FormControl<string>;
    idpCertificate: FormControl<string>;
  }>;
  redirectUrl$: Observable<string>;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EnableSAMLAuthnProviderDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    private data: EnableFederatedAuthnProviderDialogData,
    private platformService: PlatformService,
    private flagService: FlagService
  ) {
    this.redirectUrl$ = this.flagService
      .getStringFlag(ApFlagId.SAML_AUTH_ACS_URL)
      .pipe(
        map((samlAcs) => {
          return $localize`
          **Setup Instructions**:\n
          Please check the following documentation: [SAML SSO](https://activepieces.com/docs/security/sso)\
          
          **Single sign-on URL**:
          \`\`\`text
          ${samlAcs}
          \`\`\`
          **Audience URI (SP Entity ID)**:
          \`\`\`text
          Activepieces
          \`\`\`
          `;
        })
      );
    this.formGroup = this.fb.group({
      idpMetadata: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      idpCertificate: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
    this.title = $localize`SAML SSO`;
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (!this.loading$.value && this.formGroup.valid) {
      this.loading$.next(true);
      const formData = this.formGroup.getRawValue();
      const platform: Platform = {
        ...this.data.platform,
        federatedAuthProviders: {
          ...this.data.platform.federatedAuthProviders,
          saml: formData,
        },
      };
      this.enableProvider$ = this.platformService
        .updatePlatform(
          {
            federatedAuthProviders: platform.federatedAuthProviders,
          },
          this.data.platform.id
        )
        .pipe(
          tap(() => {
            this.dialogRef.close(platform);
          })
        );
    }
  }
}
