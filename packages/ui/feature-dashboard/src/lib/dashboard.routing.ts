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
  environment,
  isEeEditionGuard,
} from '@activepieces/ui/common';
import {
  ChatbotsTableComponent,
  ChatbotSettingsComponent,
  chatbotSettingsResolver,
} from '@activepieces/ui/feature-chatbot';
import { PlansPageComponent } from '@activepieces/ee-billing-ui';
import { ProjectMembersTableComponent } from '@activepieces/ee/project-members';
import { CommunityPiecesTableComponent } from './pages/community-pieces-table/community-pieces-table.component';
import { PlatformComponent } from './pages/platform/platform.component';

export const DashboardLayoutRouting: Routes = [
  {
    path: '',
    canActivate: [],
    component: DashboardContainerComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/flows' },
      {
        title: `Runs - ${environment.websiteTitle}`,
        path: 'runs',
        pathMatch: 'full',
        component: RunsTableComponent,
      },
      {
        title: `Plans - ${environment.websiteTitle}`,
        path: 'plans',
        component: PlansPageComponent,
      },
      {
        title: `Team - ${environment.websiteTitle}`,
        path: 'team',
        component: ProjectMembersTableComponent,
      },
      {
        title: `Chatbots - ${environment.websiteTitle}`,
        path: 'chatbots',
        pathMatch: 'full',
        component: ChatbotsTableComponent,
      },
      {
        path: 'chatbots/:id/settings',
        canActivate: [],
        title: `Activepieces - Chatbot settings`,
        pathMatch: 'full',
        component: ChatbotSettingsComponent,
        resolve: {
          connections: ConnectionsResolver,
          chatbot: chatbotSettingsResolver,
        },
      },
      {
        title: `Chatbots - ${environment.websiteTitle}`,
        path: 'chatbots',
        pathMatch: 'full',
        component: ChatbotsTableComponent,
      },
      {
        path: 'chatbots/:id/settings',
        canActivate: [],
        title: `Activepieces - Chatbot settings`,
        pathMatch: 'full',
        component: ChatbotSettingsComponent,
        resolve: {
          connections: ConnectionsResolver,
          chatbot: chatbotSettingsResolver,
        },
      },
      {
        title: `My Pieces - ${environment.websiteTitle}`,
        path: 'settings/my-pieces',
        component: CommunityPiecesTableComponent,
      },
      {
        title: `Team - ${environment.websiteTitle}`,
        path: 'team',
        component: ProjectMembersTableComponent,
      },
      {
        title: `Chatbots - ${environment.websiteTitle}`,
        path: 'chatbots',
        pathMatch: 'full',
        component: ChatbotsTableComponent,
      },
      {
        path: 'chatbots/:id/settings',
        canActivate: [],
        title: `Activepieces - Chatbot settings`,
        pathMatch: 'full',
        component: ChatbotSettingsComponent,
        resolve: {
          connections: ConnectionsResolver,
          chatbot: chatbotSettingsResolver,
        },
      },
      {
        title: `Connections - ${environment.websiteTitle}`,
        path: 'connections',
        pathMatch: 'full',
        component: ConnectionsTableComponent,
      },
      {
        title: `Flows - ${environment.websiteTitle}`,
        path: 'flows',
        pathMatch: 'full',
        component: FlowsTableComponent,
        resolve: {
          [ARE_THERE_FLOWS_FLAG]: AreThereFlowsResovler,
          folders: FoldersResolver,
        },
      },
      {
        title: `Platform - ${environment.websiteTitle}`,
        path: 'platform',
        pathMatch: 'full',
        component: PlatformComponent,
        canActivate: [isEeEditionGuard],
      },
    ],
  },
];
