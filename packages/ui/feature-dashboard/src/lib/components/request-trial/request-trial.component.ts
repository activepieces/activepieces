import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule, fadeIn400ms } from '@activepieces/ui/common';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivationKeysService } from '../../services/activation-key.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorCode } from '@activepieces/shared';

@Component({
  selector: 'app-request-trial-component',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
  template: `
    <div
      class=" ap-w-full ap-h-full ap-bg-[#F5F3FF] ap-text-black ap-py-5 lg:ap-py-5 ap-overflow-scroll thin-scrollbars ap-relative"
    >
      <div class="ap-absolute ap-right-[20px] ap-top-[20px]">
        <ap-icon-button
          [iconFilename]="'close.svg'"
          (buttonClicked)="close()"
        ></ap-icon-button>
      </div>
      <div
        class="ap-flex ap-flex-grow  ap-items-centeap-max-w-screen-xl ap-mx-auto ap-px-6   ap-flex-col ap-justify-center lg:ap-h-full lg:ap-w-full"
      >
        <div
          class="ap-flex  ap-gap-4 lg:ap-gap-8 ap-items-center ap-justify-center ap-flex-wrap lg:ap-flex-nowrap "
        >
          <div
            class="ap-flex ap-flex-col ap-gap-4 lg:ap-w-[478px] ap-flex-grow lg:ap-flex-grow-0 "
          >
            <svg-icon src="assets/img/custom/logo/full-logo.svg"></svg-icon>
            @if(!showCheckYourEmailNote) {
            <div
              class="ap-typography-headline-5 lg:ap-typography-headline-3 !ap-font-semibold"
            >
              Open source no-code business automation
            </div>
            <div>
              Securely deploy the easiest automation tool for your marketing,
              sales, operations, HR, finance and IT teams
            </div>
            <form
              [formGroup]="sendEmailForm"
              (submit)="submitEmail()"
              class="ap-flex ap-gap-4 ap-flex-wrap lg:ap-flex-nowrap"
            >
              <mat-form-field class="ap-flex-grow" subscriptSizing="dynamic">
                <mat-label>Email</mat-label>
                <input
                  type="email"
                  [formControl]="sendEmailForm.controls.email"
                  matInput
                  placeholder="john@doe.com"
                />
                @if(sendEmailForm.controls.email.invalid) {
                <mat-error>
                  @if(sendEmailForm.controls.email.getError('email')) {
                  <ng-container i18n>Email is invalid </ng-container> }
                  @if(sendEmailForm.controls.email.getError('required')) {
                  <ng-container i18n>Email is required </ng-container> }
                  @if(sendEmailForm.controls.email.getError(ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY))
                  {
                  <ng-container i18n
                    >Email already has a trial key sent to it
                  </ng-container>
                  }
                </mat-error>
                }
              </mat-form-field>
              <div class="ap-min-w-[162px] ap-w-full lg:ap-w-auto ">
                <ap-button
                  type="submit"
                  [loading]="loading$ | async | defaultFalse"
                  (buttonClicked)="submitEmail()"
                  btnColor="primary"
                  btnSize="large"
                  class="ap-w-full"
                  [fullWidthOfContainer]="true"
                  i18n
                >
                  Request Trial Key
                </ap-button>
              </div>
            </form>
            } @else {

            <div
              class="ap-flex ap-justify-center ap-items-center ap-my-2"
              @fadeIn
            >
              <img
                class="ap-m-auto"
                src="/assets/img/custom/auth/mail_sent.png"
              />
            </div>
            <div class="ap-text-center ap-typography-body-1 ap-mb-2" i18n>
              Please check your email for the trial key, and paste it here to
              start 🚀
            </div>
            <form
              [formGroup]="activateTrialKeyForm"
              (submit)="submitTrialKey()"
              class="ap-flex ap-gap-4 ap-flex-wrap lg:ap-flex-nowrap"
            >
              <mat-form-field class="ap-flex-grow" subscriptSizing="dynamic">
                <mat-label>Key</mat-label>
                <input
                  type="text"
                  [formControl]="activateTrialKeyForm.controls.key"
                  matInput
                />
                @if(activateTrialKeyForm.controls.key.invalid) {

                <mat-error>
                  @if(activateTrialKeyForm.controls.key.getError('required')) {
                  <ng-container i18n>Key is required</ng-container> }
                  @if(activateTrialKeyForm.controls.key.getError(ErrorCode.ACTIVATION_KEY_ALREADY_ACTIVATED)){
                  <ng-container i18n
                    >Key has already been activated </ng-container
                  >}
                  @if(activateTrialKeyForm.controls.key.getError(ErrorCode.ACTIVATION_KEY_NOT_FOUND)){
                  <ng-container i18n>Key is invalid</ng-container>}
                </mat-error>
                }
              </mat-form-field>

              <div class="ap-min-w-[162px] ap-w-full lg:ap-w-auto">
                <ap-button
                  type="submit"
                  [loading]="loading$ | async | defaultFalse"
                  (buttonClicked)="submitTrialKey()"
                  btnColor="primary"
                  btnSize="large"
                  class="ap-w-full"
                  [fullWidthOfContainer]="true"
                  i18n
                >
                  Activate Trial
                </ap-button>
              </div>
            </form>
            } @if(!showCheckYourEmailNote) {
            <a
              (click)="showCheckYourEmailNote = true"
              class="!ap-cursor-pointer"
            >
              I already have a code
            </a>
            }
            <div class="ap-flex ap-gap-2 ap-text-description ap-items-center">
              <svg-icon
                src="assets/img/custom/info.svg"
                class="ap-fill-description ap-w-[18px] ap-h-[18px]"
              ></svg-icon>
              No credit card, no commitment, no downloads. 100% free.
            </div>
          </div>
          <div class="ap-w-full lg:ap-max-w-[600px]" #video>
            <div
              class="ap-mt-6 ap-shadow-xl ap-overflow-hidden ap-rounded-xl ap-flex ap-items-center ap-justify-center "
            >
              <video
                @fadeIn
                autoplay
                loop
                muted
                playsinline
                class="ap-w-full ap-rounded-xl "
                oncanplay="this.play()"
                onloadedmetadata="this.muted = true"
              >
                <source
                  src="https://www.activepieces.com/videos/builder.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
        </div>

        <div
          class="ap-flex ap-items-center ap-justify-center ap-mt-12 ap-gap-12 ap-flex-wrap"
        >
          @for(logo of logos; track logo) {
          <img class="ap-h-8" [src]="logo" />
          }
        </div>
        <div class="ap-text-body ap-text-description ap-text-center ap-mt-4">
          37k+ Teams deploy automations securely
        </div>
      </div>
    </div>
    <img class="ap-hidden" src="/assets/img/custom/auth/mail_sent.png" />
    @if(creatTiralKey$ | async) {} @if(activateTrialKey$ | async){}
    @if(emailChanged$ | async) {}
  `,
})
export class RequestTrialComponent {
  readonly ErrorCode = ErrorCode;
  showCheckYourEmailNote = false;
  emailChanged$: Observable<unknown>;
  keyChanged$: Observable<unknown>;
  creatTiralKey$?: Observable<void>;
  activateTrialKey$?: Observable<void>;
  loading$ = new BehaviorSubject(false);
  logos = [
    'https://www.activepieces.com/logos/posthog.svg',
    'https://www.activepieces.com/logos/roblox.svg',
    'https://www.activepieces.com/logos/clickup.svg',
    'https://www.activepieces.com/logos/plivo.svg',
  ];
  sendEmailForm = this.fb.group({
    email: this.fb.control('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
  });
  activateTrialKeyForm = this.fb.group({
    key: this.fb.control('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });
  constructor(
    private fb: FormBuilder,
    private matDialog: MatDialog,
    private snackBar: MatSnackBar,
    private activationKeysService: ActivationKeysService
  ) {
    this.emailChanged$ = this.createListenerToRemoveServerErrorOnChange(
      this.sendEmailForm.controls.email,
      ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY
    );
    this.keyChanged$ = this.createListenerToRemoveServerErrorOnChange(
      this.activateTrialKeyForm.controls.key,
      ErrorCode.ACTIVATION_KEY_ALREADY_ACTIVATED,
      ErrorCode.ACTIVATION_KEY_NOT_FOUND
    );
  }
  submitEmail() {
    if (this.sendEmailForm.valid) {
      this.loading$.next(true);
      this.creatTiralKey$ = this.activationKeysService
        .createKey({
          email: this.sendEmailForm.getRawValue().email,
        })
        .pipe(
          catchError((err: HttpErrorResponse) => {
            if (
              err.error?.code === ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY
            ) {
              this.sendEmailForm.controls.email.setErrors({
                [ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY]: true,
              });
            } else {
              this.snackBar.open(
                $localize`Unexpected error please contact support on community.activepieces.com`
              );
            }
            this.loading$.next(false);
            throw err;
          }),
          tap(() => {
            this.loading$.next(false);
            this.showCheckYourEmailNote = true;
          })
        );
    }
  }

  submitTrialKey() {
    if (this.activateTrialKeyForm.valid) {
      this.loading$.next(true);
      this.activateTrialKey$ = this.activationKeysService
        .activateKey({
          key: this.activateTrialKeyForm.getRawValue().key,
        })
        .pipe(
          catchError((err: HttpErrorResponse) => {
            if (
              err.error?.code === ErrorCode.ACTIVATION_KEY_ALREADY_ACTIVATED
            ) {
              this.activateTrialKeyForm.controls.key.setErrors({
                [ErrorCode.ACTIVATION_KEY_ALREADY_ACTIVATED]: true,
              });
            } else if (err.error?.code === ErrorCode.ACTIVATION_KEY_NOT_FOUND) {
              this.activateTrialKeyForm.controls.key.setErrors({
                [ErrorCode.ACTIVATION_KEY_NOT_FOUND]: true,
              });
            } else {
              this.snackBar.open(
                $localize`Unexpected error please contact support on community.activepieces.com`
              );
            }
            this.loading$.next(false);
            throw err;
          }),
          tap(() => {
            this.loading$.next(false);
            this.showCheckYourEmailNote = true;
            this.close();
            this.snackBar.open('Trial activated successfully');
          })
        );
    }
  }
  close() {
    this.matDialog.closeAll();
  }

  createListenerToRemoveServerErrorOnChange(
    control: FormControl<unknown>,
    ...errorsNames: string[]
  ) {
    return control.valueChanges.pipe(
      tap(() => {
        const errors = this.sendEmailForm.controls.email.errors;
        errorsNames.forEach((errorName) => {
          const doErrorsContainServerError =
            errors && errors[errorName] !== undefined;
          if (doErrorsContainServerError) {
            if (Object.keys(errors).length > 1) {
              errors[errorName] = undefined;
              control.setErrors({
                ...errors,
              });
            } else {
              control.setErrors(null);
            }
          }
        });
      })
    );
  }
}
