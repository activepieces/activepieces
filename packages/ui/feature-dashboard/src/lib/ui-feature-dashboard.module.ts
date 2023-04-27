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
import { FOLDERS_STATE_NAME } from './store/folders/folders.selector';
import { foldersReducer } from './store/folders/folders.reducer';
import { StoreModule } from '@ngrx/store';
import { MoveFlowToFolderDialogComponent } from './pages/flows-table/move-flow-to-folder-dialog/move-flow-to-folder-dialog.component';
import { EffectsModule } from '@ngrx/effects';
import { FoldersEffects } from './store/folders/folders.effects';
import { RenameFolderDialogComponent } from './pages/flows-table/rename-folder-dialog/rename-folder-dialog.component';
import { EeBillingUiModule } from '@activepieces/ee/billing/ui';
import { StepsListInFlowsTableComponent } from './pages/flows-table/steps-list-in-flows-table/steps-list-in-flows-table.component';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    EeBillingUiModule,
    RouterModule.forChild(DashboardLayoutRouting),
    StoreModule.forFeature(FOLDERS_STATE_NAME, foldersReducer),
    EffectsModule.forFeature([FoldersEffects]),
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
    MoveFlowToFolderDialogComponent,
    RenameFolderDialogComponent,
    StepsListInFlowsTableComponent,
  ],
})
export class UiFeatureDashboardModule {}
