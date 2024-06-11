import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import { InviteUserDialogComponent } from '../dialogs/invite-user-dialog/invite-user-dialog.component';

@Component({
  selector: 'app-invite-user-button',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ap-button
      btnColor="white"
      btnStyle="stroked"
      btnSize="medium"
      (buttonClicked)="openInviteAdminDialog()"
      i18n
    >
      <div class="ap-flex ap-gap-2 ap-items-center">
        <svg-icon
          [applyClass]="true"
          [svgStyle]="{ width: '18px', height: '18px' }"
          src="assets/img/custom/person_add.svg"
        ></svg-icon>
        <b>Invite user</b>
      </div>
    </ap-button>
  `,
})
export class InviteUserButtonComponent {
  constructor(private matDialog: MatDialog) {}
  openInviteAdminDialog() {
    this.matDialog.open(InviteUserDialogComponent);
  }
}
