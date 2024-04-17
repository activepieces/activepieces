import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AuthenticationService,
  TelemetryService,
  UiCommonModule,
} from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import { RewardsDialogComponent } from '../dialogs/rewards-dialog/rewards-dialog.component';
import { TelemetryEventName } from '@activepieces/shared';
const LAST_CLOSED_KEY_LOCAL_STORAGE = 'rewardsNoteClosed';
const COMPLIMENTS = [
  'Well done on your flows 👏',
  'Great job on your flows 🎉',
  'Amazing flows 🔥',
];
@Component({
  selector: 'app-rewards-note-component',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if(show) {
    <div
      class="ap-rounded ap-py-1 ap-px-3 ap-flex ap-justify-between ap-items-center"
      [style.backgroundColor]="bgColor"
    >
      <div>
        {{ compliment }} Did you know sharing them with the community can get
        you
        <a
          class="ap-cursor-pointer !ap-typography-body-1"
          (click)="openRewardsDialog()"
          >free tasks</a
        >
        ?
      </div>
      <ap-icon-button
        [iconFilename]="'close.svg'"
        (buttonClicked)="close()"
      ></ap-icon-button>
    </div>
    }
  `,
})
export class RewardsNoteComponent {
  bgColor = '#d2fce2';
  show = true;
  compliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
  constructor(
    private matDialog: MatDialog,
    private telemteryService: TelemetryService,
    private authenticationService: AuthenticationService
  ) {
    const lastClosed = localStorage.getItem(LAST_CLOSED_KEY_LOCAL_STORAGE);
    const now = new Date();
    const lastClosedDate = lastClosed ? new Date(lastClosed) : null;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    this.show =
      !lastClosedDate ||
      Math.abs(now.getTime() - lastClosedDate.getTime()) > oneWeek;
  }

  close() {
    this.show = false;
    localStorage.setItem(
      LAST_CLOSED_KEY_LOCAL_STORAGE,
      new Date().toISOString()
    );
  }

  openRewardsDialog() {
    this.matDialog.open(RewardsDialogComponent);
    this.telemteryService.capture({
      name: TelemetryEventName.REWARDS_OPENED,
      payload: {
        email: this.authenticationService.currentUser.email,
        userId: this.authenticationService.currentUser.id,
        source: 'note',
      },
    });
  }
}
