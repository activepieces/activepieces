import { Routes } from '@angular/router';
import { FlowsTableComponent } from './pages/flows-table/flows-table.component';
import {
  ARE_THERE_FLOWS_FLAG,
  AreThereFlowsResolver,
} from './resolvers/are-there-flows.resolver';
import { ConnectionsTableComponent } from './pages/connections-table/connections-table.component';
import { FoldersResolver } from '@activepieces/ui/feature-folders-store';
import { DashboardContainerComponent } from './dashboard-container.component';
import {
  PLATFORM_RESOLVER_KEY,
  PlatformResolver,
  showBasedOnFlagGuard,
  showBasedOnRoles,
  showPlatformSettingsGuard,
  PROJECT_ROLE_DISABLED_RESOLVER_KEY,
  projectRoleDisabledResolver,
} from '@activepieces/ui/common';
import { PlansPageComponent } from 'ee-billing-ui';
import { ProjectMembersTableComponent } from 'ee-project-members';
import { ApFlagId, ProjectMemberRole } from '@activepieces/shared';
import { IssuesTableComponent } from './components/issues-table/issues-table.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { FLAGS_RESOLVE_DATA, FlagsResolver } from './resolvers/flags.resolver';
import { RunsComponent } from './pages/runs/runs.component';

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
        component: RunsComponent,
        canActivate: [
          showBasedOnRoles([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.OPERATOR,
            ProjectMemberRole.VIEWER,
          ]),
        ],
      },
      {
        data: {
          title: $localize`Issues`,
        },
        path: 'issues',
        pathMatch: 'full',
        component: IssuesTableComponent,
        canActivate: [
          showBasedOnRoles([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.OPERATOR,
            ProjectMemberRole.VIEWER,
          ]),
        ],
      },
      {
        data: {
          title: $localize`Plans`,
        },
        canActivate: [
          showBasedOnFlagGuard(ApFlagId.SHOW_BILLING),
          showBasedOnRoles([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.VIEWER,
          ]),
        ],
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
          [PROJECT_ROLE_DISABLED_RESOLVER_KEY]: projectRoleDisabledResolver,
        },
        canActivate: [
          showBasedOnRoles([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.OPERATOR,
            ProjectMemberRole.VIEWER,
          ]),
        ],
      },
      {
        data: {
          title: $localize`Connections`,
        },
        path: 'connections',
        pathMatch: 'full',
        component: ConnectionsTableComponent,
        canActivate: [
          showBasedOnRoles([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.OPERATOR,
            ProjectMemberRole.VIEWER,
          ]),
        ],
      },
      {
        data: {
          title: $localize`Settings`,
        },
        path: 'settings',
        pathMatch: 'full',
        component: SettingsPageComponent,
        resolve: {
          [FLAGS_RESOLVE_DATA]: FlagsResolver,
          [PLATFORM_RESOLVER_KEY]: PlatformResolver,
        },
        canActivate: [
          showBasedOnRoles([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.OPERATOR,
            ProjectMemberRole.VIEWER,
          ]),
        ],
      },
      {
        data: {
          title: $localize`Flows`,
        },
        path: 'flows',
        pathMatch: 'full',
        component: FlowsTableComponent,
        resolve: {
          [ARE_THERE_FLOWS_FLAG]: AreThereFlowsResolver,
          folders: FoldersResolver,
        },
        canActivate: [
          showBasedOnRoles([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.OPERATOR,
            ProjectMemberRole.VIEWER,
          ]),
        ],
      },
      {
        data: {
          title: $localize`Platform`,
        },
        path: 'platform',
        pathMatch: 'prefix',
        loadChildren: () =>
          import('ui-ee-platform').then((res) => res.UiEePlatformModule),
        canActivate: [showPlatformSettingsGuard],
      },
    ],
  },
];
