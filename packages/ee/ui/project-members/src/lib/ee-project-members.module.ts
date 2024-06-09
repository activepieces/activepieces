import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AcceptInvitationComponent } from './accept-invitation/accept-invitation.component';
import { ApDatePipe, UiCommonModule } from '@activepieces/ui/common';
import { ProjectMembersTableComponent } from './project-members-table/project-members-table.component';
import { EeBillingUiModule } from 'ee-billing-ui';
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
    ApDatePipe,
  ],
  declarations: [AcceptInvitationComponent, ProjectMembersTableComponent],
  exports: [AcceptInvitationComponent, ProjectMembersTableComponent],
  providers: [DatePipe],
})
export class EeProjectMembersModule {}
