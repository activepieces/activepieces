import { Routes } from '@angular/router';
import { RunsTableComponent } from './pages/runs-table/runs-table.component';
import { FlowsTableComponent } from './pages/flows-table/flows-table.component';
import {
  ARE_THERE_FLOWS_FLAG,
  AreThereFlowsResovler,
} from './resolvers/are-there-flows.resolver';
import { ConnectionsTableComponent } from './pages/connections-table/connections-table.component';
import { FoldersResolver } from './resolvers/folders.resolver';
import { DashboardContainerComponent } from './dashboard-container.component';
import {
  ConnectionsResolver,
  showPlatformSettingsGuard,
} from '@activepieces/ui/common';
import {
  ChatbotsTableComponent,
  ChatbotSettingsComponent,
  chatbotSettingsResolver,
} from '@activepieces/ui/feature-chatbot';
import { PlansPageComponent } from '@activepieces/ee-billing-ui';
import { ProjectMembersTableComponent } from '@activepieces/ee/project-members';
import { CommunityPiecesTableComponent } from './pages/community-pieces-table/community-pieces-table.component';

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
        path: 'plans',
        component: PlansPageComponent,
      },
      {
        data: {
          title: $localize`Team`,
        },
        path: 'team',
        component: ProjectMembersTableComponent,
      },
      {
        data: {
          title: $localize`Chatbots`,
        },
        path: 'chatbots',
        pathMatch: 'full',
        component: ChatbotsTableComponent,
      },
      {
        path: 'chatbots/:id/settings',
        canActivate: [],
        data: {
          title: $localize`Chatbot settings`,
        },
        pathMatch: 'full',
        component: ChatbotSettingsComponent,
        resolve: {
          connections: ConnectionsResolver,
          chatbot: chatbotSettingsResolver,
        },
      },
      {
        data: {
          title: $localize`Chatbots`,
        },
        path: 'chatbots',
        pathMatch: 'full',
        component: ChatbotsTableComponent,
      },
      {
        path: 'chatbots/:id/settings',
        canActivate: [],
        data: {
          title: $localize`Chatbot settings`,
        },
        pathMatch: 'full',
        component: ChatbotSettingsComponent,
        resolve: {
          connections: ConnectionsResolver,
          chatbot: chatbotSettingsResolver,
        },
      },
      {
        data: {
          title: $localize`My Pieces`,
        },
        path: 'settings/my-pieces',
        component: CommunityPiecesTableComponent,
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
        pathMatch: 'full',
        loadChildren: () =>
          import('@activepieces/ui-ee-platform').then(
            (res) => res.UiEePlatformModule
          ),
        canActivate: [showPlatformSettingsGuard],
      },
    ],
  },
];
