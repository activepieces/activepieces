import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformService, UiCommonModule } from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import { Observable, tap, take } from 'rxjs';
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
      [loading]="loading"
      [darkLoadingSpinner]="true"
      i18n
    >
      <div class="ap-flex ap-gap-2 ap-items-center ap-whitespace-nowrap">
        <svg-icon
          [applyClass]="true"
          [svgStyle]="{ width: '18px', height: '18px' }"
          src="assets/img/custom/person_add.svg"
        ></svg-icon>
        <b class="ap-hidden sm:ap-inline-block">Invite user</b>
      </div>
    </ap-button>
    @if(openDialog$ | async) {}
  `,
})
export class InviteUserButtonComponent {
  loading = false;
  openDialog$?: Observable<unknown>;
  constructor(
    private matDialog: MatDialog,
    private platformService: PlatformService
  ) {}
  openInviteAdminDialog() {
    this.loading = true;
    this.openDialog$ = this.platformService.currentPlatformNotNull().pipe(
      take(1),
      tap((platform) => {
        this.loading = false;
        this.matDialog.open(InviteUserDialogComponent, {
          data: {
            platform,
          },
        });
      })
    );
  }
}
