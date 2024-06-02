import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-request-trial-component',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          <div class="ap-flex ap-flex-col ap-gap-4 lg:ap-w-[600px] ">
            <svg-icon src="assets/img/custom/logo/full-logo.svg"></svg-icon>
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
              [formGroup]="form"
              (submit)="submit()"
              class="ap-flex ap-gap-4 ap-flex-wrap lg:ap-flex-nowrap"
            >
              <mat-form-field class="ap-w-full" subscriptSizing="dynamic">
                <mat-label>Email</mat-label>
                <input
                  type="email"
                  [formControl]="form.controls.email"
                  matInput
                  placeholder="john@doe.com"
                />
                @if(form.controls.email.invalid) {
                <mat-error>
                  @if( form.controls.email.getError('email')) {
                  <ng-container i18n>Email is invalid </ng-container>
                  } @else {
                  <ng-container i18n> Email is required </ng-container> }
                </mat-error>
                }
              </mat-form-field>
              <div class="ap-min-w-[162px] ap-w-full">
                <ap-button
                  type="submit"
                  [loading]="loading"
                  (buttonClicked)="submit()"
                  btnColor="primary"
                  btnSize="large"
                  class="ap-w-full lg:ap-w-auto"
                  [fullWidthOfContainer]="true"
                  i18n
                >
                  Request Trial Key
                </ap-button>
              </div>
            </form>

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
  `,
})
export class RequestTrialComponent {
  logos = [
    'https://www.activepieces.com/logos/posthog.svg',
    'https://www.activepieces.com/logos/roblox.svg',
    'https://www.activepieces.com/logos/clickup.svg',
    'https://www.activepieces.com/logos/plivo.svg',
  ];
  form = this.fb.group({
    email: ['', Validators.required],
  });
  constructor(private fb: FormBuilder, private matDialog: MatDialog) {}
  loading = false;
  submit() {
    if (this.form.valid) {
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
        this.form.reset();
      }, 2000);
    }
  }
  close() {
    this.matDialog.closeAll();
  }
}
