import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { PlatformService } from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@activepieces/shared';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PLATFORM_RESOLVER_KEY } from '../../platform.resolver';

interface SmtpForm {
  smtpHost: FormControl<string>;
  smtpPort: FormControl<number>;
  smtpUser: FormControl<string>;
  smtpPassword: FormControl<string>;
  smtpSenderEmail: FormControl<string>;
  smtpUseSSL: FormControl<boolean>;
}
@Component({
  selector: 'app-smtp-settings',
  templateUrl: './smtp-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmtpSettingsComponent implements OnInit {
  smtpSettingsForm: FormGroup<SmtpForm>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  saving$?: Observable<void>;
  constructor(
    private fb: FormBuilder,
    private platformService: PlatformService,
    private route: ActivatedRoute,
    private matSnackbar: MatSnackBar
  ) {
    this.smtpSettingsForm = this.fb.group({
      smtpHost: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      smtpPort: this.fb.control(1234, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      smtpUser: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      smtpPassword: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      smtpSenderEmail: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      smtpUseSSL: this.fb.control(false, {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }
  ngOnInit(): void {
    const platform: Platform = this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
    this.smtpSettingsForm.patchValue(platform);
  }
  save(): void {
    this.smtpSettingsForm.markAllAsTouched();
    if (this.smtpSettingsForm.valid && this.loading$.value === false) {
      const platform: Platform =
        this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
      this.loading$.next(true);
      this.saving$ = this.platformService
        .updatePlatform(
          {
            ...this.smtpSettingsForm.value,
          },
          platform.id
        )
        .pipe(
          tap(() => {
            this.loading$.next(false);
            this.matSnackbar.open($localize`Saved successfully`);
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
