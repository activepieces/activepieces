import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardContainerComponent } from './dashboard-container.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { SidenavRoutesListComponent } from './components/sidenav-routes-list/sidenav-routes-list.component';
import { RunsTableComponent } from './pages/runs-table/runs-table.component';
import { FlowsTableComponent } from './pages/flows-table/flows-table.component';
import { EmptyFlowsTableComponent } from './pages/flows-table/empty-flows-table/empty-flows-table.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { PageTitleComponent } from './components/page-title/page-title.component';
import { ConnectionsTableComponent } from './pages/connections-table/connections-table.component';
import { RouterModule } from '@angular/router';
import { DashboardLayoutRouting } from './dashboard.routing';
import { FlowsTableTitleComponent } from './pages/flows-table/flows-table-title/flows-table-title.component';
import { FoldersListComponent } from './pages/flows-table/folders-list/folders-list.component';
import { NewFolderDialogComponent } from './pages/flows-table/new-folder-dialog/new-folder-dialog.component';
// import { EeBillingUiModule } from '@activepieces/ee/billing/ui';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    // EeBillingUiModule,
    RouterModule.forChild(DashboardLayoutRouting),
  ],
  declarations: [
    DashboardContainerComponent,
    SidenavRoutesListComponent,
    RunsTableComponent,
    FlowsTableComponent,
    EmptyFlowsTableComponent,
    UserAvatarComponent,
    PageTitleComponent,
    ConnectionsTableComponent,
    FlowsTableTitleComponent,
    FoldersListComponent,
    NewFolderDialogComponent,
  ],
})
export class UiFeatureDashboardModule {}
