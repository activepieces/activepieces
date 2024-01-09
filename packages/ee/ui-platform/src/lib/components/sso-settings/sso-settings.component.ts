import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Platform } from '@activepieces/ee-shared';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
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
    enforceAllowedAuthDomains: FormControl<boolean>;
    allowedAuthDomains: FormControl<string[]>;
  }>;
  toggleAuthDomainsArray$: Observable<boolean>;
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
          disabled: true,
          value: [] as string[],
        },
        {
          validators: [Validators.required],
          nonNullable: true,
        }
      ),
      enforceAllowedAuthDomains: new FormControl(false, {
        nonNullable: true,
      }),
    });
    this.toggleAuthDomainsArray$ =
      this.ssoSettingsForm.controls.enforceAllowedAuthDomains.valueChanges.pipe(
        tap((val) => {
          val
            ? this.ssoSettingsForm.controls.allowedAuthDomains.enable()
            : this.ssoSettingsForm.controls.allowedAuthDomains.disable();
        })
      );
  }
  ngOnInit() {
    const platform: Platform = this.route.snapshot.data['platform'];
    this.ssoSettingsForm.patchValue(platform);
  }

  save() {
    const platform: Platform = this.route.snapshot.data['platform'];
    this.ssoSettingsForm.markAllAsTouched();
    if (!this.loading$.value && this.ssoSettingsForm.valid) {
      this.saving$ = this.platformService
        .updatePlatform(this.ssoSettingsForm.getRawValue(), platform.id)
        .pipe(
          tap(() => {
            this.loading$.next(false);
            this.matSnackbar.open($localize`Saved successfully`);
          })
        );
    }
  }
}
