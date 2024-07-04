import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ap-contact-sales-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ap-dialog-title-template i18n>Upgrade Now</ap-dialog-title-template>
    <mat-dialog-content class="ap-typography-body-2">
      <p class="ap-mb-2">
        Book a call with our sales team to learn more about our Enterprise
        features<br />and get a quote that fits your requirements.
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <div class="ap-flex ap-gap-2.5">
        <ap-button
          btnColor="basic"
          mat-dialog-close
          btnSize="default"
          btnColor="basic"
          i18n
        >
          Close
        </ap-button>
        <ap-button
          extraClasses="agree-button"
          (buttonClicked)="openBookMeetingPage()"
          mat-dialog-close
          btnSize="default"
          i18n
        >
          Book a call
        </ap-button>
      </div>
    </mat-dialog-actions>
  `,
})
export class ContactSalesDialogComponent {
  openBookMeetingPage() {
    window.open('https://calendly.com/activepieces/30min', '_blank');
  }
}
