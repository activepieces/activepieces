import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardContainerComponent } from './dashboard-container.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { SidenavRoutesListComponent } from './components/sidenav-routes-list/sidenav-routes-list.component';
import { RunsTableComponent } from './pages/runs-table/runs-table.component';
import { CollectionsTableComponent } from './pages/collections-table/collections-table.component';
import { EmptyCollectionsTableComponent } from './pages/collections-table/empty-collections-table/empty-collections-table.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { PageTitleComponent } from './components/page-title/page-title.component';
import { ConnectionsTableComponent } from './pages/connections-table/connections-table.component';
import { DeleteEntityDialogComponent } from './components/delete-enity-dialog/delete-collection-dialog.component';
import { RouterModule } from '@angular/router';
import { DashboardLayoutRouting } from './dashboard.routing';
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
    CollectionsTableComponent,
    EmptyCollectionsTableComponent,
    UserAvatarComponent,
    PageTitleComponent,
    ConnectionsTableComponent,
    DeleteEntityDialogComponent,
  ],
})
export class UiFeatureDashboardModule {}
