import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Platform } from '@activepieces/ee-shared';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { PlatformService, fadeInUp400ms } from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sso-settings',
  templateUrl: './sso-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
})
export class SsoSettingsComponent implements OnInit {
  loading$ = new BehaviorSubject<boolean>(false);
  ssoSettingsForm: FormGroup<{
    allowedAuthDomains: FormControl<string[]>;
  }>;

  saving$?: Observable<void>;
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private platformService: PlatformService,
    private matSnackbar: MatSnackBar
  ) {
    this.ssoSettingsForm = this.fb.group({
      allowedAuthDomains: new FormControl(
        {
          disabled: false,
          value: [] as string[],
        },
        {
          nonNullable: true,
        }
      ),
    });
  }
  ngOnInit() {
    const platform: Platform = this.route.snapshot.data['platform'];
    this.ssoSettingsForm.patchValue(platform);
  }

  save() {
    const platform: Platform = this.route.snapshot.data['platform'];
    this.ssoSettingsForm.markAllAsTouched();
    if (!this.loading$.value && this.ssoSettingsForm.valid) {
      const allowedAuthDomains = this.ssoSettingsForm.value.allowedAuthDomains;
      this.saving$ = this.platformService
        .updatePlatform(
          {
            enforceAllowedAuthDomains: allowedAuthDomains ? true : false,
            allowedAuthDomains: allowedAuthDomains ?? [],
          },
          platform.id
        )
        .pipe(
          tap(() => {
            this.loading$.next(false);
            this.matSnackbar.open($localize`Saved successfully`);
          })
        );
    }
  }
}
