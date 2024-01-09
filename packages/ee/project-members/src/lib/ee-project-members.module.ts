import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcceptInvitationComponent } from './accept-invitation/accept-invitation.component';
import { InviteProjectMemberDialogComponent } from './dialogs/invite-project-member-dialog/invite-project-member.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { ProjectMembersTableComponent } from './project-members-table/project-members-table.component';
import { EeBillingUiModule } from '@activepieces/ee-billing-ui';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    EeBillingUiModule,
    RouterModule.forChild([
      {
        path: 'invitation',
        component: AcceptInvitationComponent,
      },
    ]),
  ],
  declarations: [
    AcceptInvitationComponent,
    InviteProjectMemberDialogComponent,
    ProjectMembersTableComponent,
  ],
  exports: [
    AcceptInvitationComponent,
    InviteProjectMemberDialogComponent,
    ProjectMembersTableComponent,
  ],
})
export class EeProjectMembersModule {}
