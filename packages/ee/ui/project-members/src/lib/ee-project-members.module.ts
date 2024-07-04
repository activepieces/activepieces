import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApDatePipe, UiCommonModule } from '@activepieces/ui/common';
import { ProjectMembersTableComponent } from './project-members-table/project-members-table.component';
import { EeBillingUiModule } from 'ee-billing-ui';

@NgModule({
  imports: [CommonModule, UiCommonModule, EeBillingUiModule, ApDatePipe],
  declarations: [ProjectMembersTableComponent],
  exports: [ProjectMembersTableComponent],
  providers: [DatePipe],
})
export class EeProjectMembersModule {}
