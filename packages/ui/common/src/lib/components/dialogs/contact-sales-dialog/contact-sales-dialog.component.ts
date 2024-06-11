import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ap-contact-sales-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ap-dialog-title-template i18n>Contact Sales </ap-dialog-title-template>
    <mat-dialog-content>
      Would you like to book a meeting with us to discuss your enterpirse deal ?
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
          (buttonClicked)="openBookMeetingPage()"
          mat-dialog-close
          btnSize="default"
          i18n
        >
          Agree
        </ap-button>
      </div>
    </mat-dialog-actions>
  `,
})
export class ContactSalesDialogComponent {
  openBookMeetingPage() {
    window.location.href = 'https://calendly.com/activepieces/30min';
  }
}
