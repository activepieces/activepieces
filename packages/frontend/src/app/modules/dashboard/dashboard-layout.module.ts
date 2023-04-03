import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardContainerComponent } from './dashboard-container.component';
import { RouterModule } from '@angular/router';
import { DashboardLayoutRouting } from './dashboard.routing';
import { RunsTableComponent } from './pages/runs-table/runs-table.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { CollectionsTableComponent } from './pages/collections-table/collections-table.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { EmptyCollectionsTableComponent } from './pages/collections-table/empty-collections-table/empty-collections-table.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { SidenavRoutesListComponent } from './components/sidenav-routes-list/sidenav-routes-list.component';
import { PageTitleComponent } from './components/page-title/page-title.component';
import { ConnectionsTableComponent } from './pages/connections-table/connections-table.component';
import { RunsLeftSnackbarComponent } from '@ee/billing/frontend/runs-left-snackbar/runs-left-snackbar.component';
import { DeleteEntityDialogComponent } from './components/delete-enity-dialog/delete-collection-dialog.component';
import { UiFeatureTeamsModule } from '@activepieces/ui/feature-teams';

@NgModule({
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
    RunsLeftSnackbarComponent,
  ],
  imports: [
    CommonModule,
    CommonLayoutModule,
    UiCommonModule,
    RouterModule.forChild(DashboardLayoutRouting),
    ReactiveFormsModule,
    FontAwesomeModule,
    NgxSkeletonLoaderModule,
    UiFeatureTeamsModule,
  ],
  exports: [],
  providers: [],
})
export class DashboardLayoutModule {}
