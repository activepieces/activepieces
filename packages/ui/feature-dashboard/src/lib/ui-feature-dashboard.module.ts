import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DashboardContainerComponent } from './dashboard-container.component';
import {
  ApDatePipe,
  DropdownSearchControlComponent,
  SelectAllDirective,
  UiCommonModule,
} from '@activepieces/ui/common';
import { SidenavRoutesListComponent } from './components/sidenav-routes-list/sidenav-routes-list.component';
import { FlowsTableComponent } from './pages/flows-table/flows-table.component';
import { EmptyFlowsTableComponent } from './pages/flows-table/empty-flows-table/empty-flows-table.component';
import { ConnectionsTableComponent } from './pages/connections-table/connections-table.component';
import { RouterModule } from '@angular/router';
import { DashboardLayoutRouting } from './dashboard.routing';
import { FlowsTableTitleComponent } from './pages/flows-table/flows-table-title/flows-table-title.component';
import { FoldersListComponent } from './pages/flows-table/folders-list/folders-list.component';
import { NewFolderDialogComponent } from './components/dialogs/new-folder-dialog/new-folder-dialog.component';
import { RenameFolderDialogComponent } from './components/dialogs/rename-folder-dialog/rename-folder-dialog.component';
import { EeBillingUiModule } from 'ee-billing-ui';
import { UiFeatureTemplatesModule } from '@activepieces/ui/feature-templates';
import { UiFeaturePiecesModule } from '@activepieces/ui/feature-pieces';
import { ProjectSwitcherComponent } from './components/project-switcher/project-switcher.component';
import { TriggerTooltipPipe } from './pipes/trigger-tooltip.pipe';
import { TriggerIconPipe } from './pipes/trigger-icon.pipe';
import { FlowStatusPipe } from './pipes/flow-status-tooltip.pipe';
import { EeComponentsModule } from 'ee-components';
import { RenameFlowDialogComponent } from './components/dialogs/rename-flow-dialog/rename-flow-dialog.component';
import { UiFeatureFoldersStoreModule } from '@activepieces/ui/feature-folders-store';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NewConnectionDialogComponent } from './components/dialogs/new-connection-dialog/new-connection-dialog.component';
import { UiFeatureConnectionsModule } from '@activepieces/ui/feature-connections';
import { ContactSalesComponent } from './components/contact-sales/contact-sales.component';
import { FormsModule } from '@angular/forms';
import {
  PushFlowToGitButtonComponent,
  SyncProjectComponent,
} from '@activepieces/ui-feature-git-sync';
import { RewardsDialogComponent } from './components/dialogs/rewards-dialog/rewards-dialog.component';
import { NewAlertDialogComponent } from './components/dialogs/new-alert-dialog/new-alert-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    SidenavRoutesListComponent,
    EeBillingUiModule,
    RouterModule.forChild(DashboardLayoutRouting),
    UiFeatureFoldersStoreModule,
    UiFeatureTemplatesModule,
    UiFeaturePiecesModule,
    TriggerTooltipPipe,
    TriggerIconPipe,
    FlowStatusPipe,
    EeComponentsModule,
    PushFlowToGitButtonComponent,
    MatDatepickerModule,
    MatNativeDateModule,
    UiFeatureConnectionsModule,
    FormsModule,
    SyncProjectComponent,
    RewardsDialogComponent,
    DropdownSearchControlComponent,
    SelectAllDirective,
    ApDatePipe,
  ],
  declarations: [
    DashboardContainerComponent,
    FlowsTableComponent,
    EmptyFlowsTableComponent,
    ConnectionsTableComponent,
    FlowsTableTitleComponent,
    FoldersListComponent,
    NewFolderDialogComponent,
    RenameFolderDialogComponent,
    ProjectSwitcherComponent,
    RenameFlowDialogComponent,
    NewConnectionDialogComponent,
    ContactSalesComponent,
    NewAlertDialogComponent,
  ],
  providers: [DatePipe],
})
export class UiFeatureDashboardModule {}
