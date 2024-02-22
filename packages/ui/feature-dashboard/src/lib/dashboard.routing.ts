import { Routes } from '@angular/router';
import { RunsTableComponent } from './pages/runs-table/runs-table.component';
import { FlowsTableComponent } from './pages/flows-table/flows-table.component';
import {
  ARE_THERE_FLOWS_FLAG,
  AreThereFlowsResovler,
} from './resolvers/are-there-flows.resolver';
import { ConnectionsTableComponent } from './pages/connections-table/connections-table.component';
import { FoldersResolver } from '@activepieces/ui/feature-folders-store';
import { DashboardContainerComponent } from './dashboard-container.component';
import {
  isFeatureFlagEnabledResolver,
  showBasedOnFlagGuard,
  showPlatformSettingsGuard,
} from '@activepieces/ui/common';
import { PlansPageComponent } from '@activepieces/ee-billing-ui';
import { ProjectMembersTableComponent } from '@activepieces/ee/project-members';
import { CommunityPiecesTableComponent } from '@activepieces/ui/feature-pieces';
import { ApFlagId } from '@activepieces/shared';
import { SyncProjectComponent } from './pages/sync-project/sync-project.component';
import { RepoResolver } from './resolvers/repo.resolver';
import { ActivityTableComponent } from './pages/activity-table/activity-table.component';

export const DashboardLayoutRouting: Routes = [
  {
    path: '',
    canActivate: [],
    component: DashboardContainerComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/flows' },
      {
        data: {
          title: $localize`Runs`,
        },
        path: 'runs',
        pathMatch: 'full',
        component: RunsTableComponent,
      },
      {
        data: {
          title: $localize`Plans`,
        },
        canActivate: [showBasedOnFlagGuard(ApFlagId.SHOW_BILLING)],
        path: 'plans',
        component: PlansPageComponent,
      },
      {
        data: {
          title: $localize`Team`,
        },
        path: 'team',
        component: ProjectMembersTableComponent,
        resolve: {
          [ApFlagId.PROJECT_MEMBERS_ENABLED]: isFeatureFlagEnabledResolver(
            ApFlagId.PROJECT_MEMBERS_ENABLED
          ),
        },
      },
      {
        data: {
          title: $localize`My Pieces`,
        },
        path: 'settings/my-pieces',
        canActivate: [showBasedOnFlagGuard(ApFlagId.SHOW_COMMUNITY_PIECES)],
        component: CommunityPiecesTableComponent,
      },
      {
        data: {
          title: $localize`Activity`,
        },
        path: 'activity',
        pathMatch: 'full',
        component: ActivityTableComponent,
      },
      {
        data: {
          title: $localize`Connections`,
        },
        path: 'connections',
        pathMatch: 'full',
        component: ConnectionsTableComponent,
      },
      {
        data: {
          title: $localize`Settings`,
        },
        path: 'settings',
        pathMatch: 'full',
        component: SyncProjectComponent,
        resolve: { repo: RepoResolver },
      },
      {
        data: {
          title: $localize`Flows`,
        },
        path: 'flows',
        pathMatch: 'full',
        component: FlowsTableComponent,
        resolve: {
          [ARE_THERE_FLOWS_FLAG]: AreThereFlowsResovler,
          folders: FoldersResolver,
        },
      },
      {
        data: {
          title: $localize`Platform`,
        },
        path: 'platform',
        pathMatch: 'prefix',
        loadChildren: () =>
          import('@activepieces/ui-ee-platform').then(
            (res) => res.UiEePlatformModule
          ),
        canActivate: [showPlatformSettingsGuard],
      },
    ],
  },
];
