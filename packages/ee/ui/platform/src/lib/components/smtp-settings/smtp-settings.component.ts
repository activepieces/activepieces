import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { PlatformService } from '@activepieces/ui/common';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Platform } from '@activepieces/shared';

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
  @Input({ required: true }) platform?: Platform;

  smtpSettingsForm: FormGroup<SmtpForm>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  saving$?: Observable<void>;
  upgradeNoteTitle = $localize`Unlock Email Settings`;
  upgradeNote = $localize`Configure your email provider settings for when you send users authentication emails or failed runs notifications.`;
  constructor(
    private fb: FormBuilder,
    private platformService: PlatformService,
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
    if (this.platform) {
      this.smtpSettingsForm.patchValue(this.platform);
    }
  }
  save(): void {
    this.smtpSettingsForm.markAllAsTouched();
    if (
      this.smtpSettingsForm.valid &&
      this.loading$.value === false &&
      this.platform
    ) {
      this.loading$.next(true);
      this.saving$ = this.platformService
        .updatePlatform(
          {
            ...this.smtpSettingsForm.value,
          },
          this.platform.id
        )
        .pipe(
          tap(() => {
            this.loading$.next(false);
            this.matSnackbar.open($localize`Saved successfully`);
          }),
          catchError((err) => {
            this.loading$.next(false);
            this.matSnackbar.open(
              $localize`Error occurred while saving, please try again`,
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
