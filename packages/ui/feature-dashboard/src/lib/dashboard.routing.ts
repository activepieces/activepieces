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
import { ConnectionsResolver, environment } from '@activepieces/ui/common';
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
        title: $localize`Runs - ${environment.websiteTitle}`,
        path: 'runs',
        pathMatch: 'full',
        component: RunsTableComponent,
      },
      {
        title: $localize`Plans - ${environment.websiteTitle}`,
        path: 'plans',
        component: PlansPageComponent,
      },
      {
        title: $localize`Team - ${environment.websiteTitle}`,
        path: 'team',
        component: ProjectMembersTableComponent,
      },
      {
        title: $localize`Chatbots - ${environment.websiteTitle}`,
        path: 'chatbots',
        pathMatch: 'full',
        component: ChatbotsTableComponent,
      },
      {
        path: 'chatbots/:id/settings',
        canActivate: [],
        title: $localize`Chatbot settings - ${environment.websiteTitle}`,
        pathMatch: 'full',
        component: ChatbotSettingsComponent,
        resolve: {
          connections: ConnectionsResolver,
          chatbot: chatbotSettingsResolver,
        },
      },
      {
        title: $localize`Chatbots - ${environment.websiteTitle}`,
        path: 'chatbots',
        pathMatch: 'full',
        component: ChatbotsTableComponent,
      },
      {
        path: 'chatbots/:id/settings',
        canActivate: [],
        title: $localize`Chatbot settings - ${environment.websiteTitle}`,
        pathMatch: 'full',
        component: ChatbotSettingsComponent,
        resolve: {
          connections: ConnectionsResolver,
          chatbot: chatbotSettingsResolver,
        },
      },
      {
        title: $localize`My Pieces - ${environment.websiteTitle}`,
        path: 'settings/my-pieces',
        component: CommunityPiecesTableComponent,
      },
      {
        title: $localize`Team - ${environment.websiteTitle}`,
        path: 'team',
        component: ProjectMembersTableComponent,
      },
      {
        title: $localize`Chatbots - ${environment.websiteTitle}`,
        path: 'chatbots',
        pathMatch: 'full',
        component: ChatbotsTableComponent,
      },
      {
        path: 'chatbots/:id/settings',
        canActivate: [],
        title: $localize`Chatbot settings - ${environment.websiteTitle}`,
        pathMatch: 'full',
        component: ChatbotSettingsComponent,
        resolve: {
          connections: ConnectionsResolver,
          chatbot: chatbotSettingsResolver,
        },
      },
      {
        title: $localize`Connections - ${environment.websiteTitle}`,
        path: 'connections',
        pathMatch: 'full',
        component: ConnectionsTableComponent,
      },
      {
        title: $localize`Flows - ${environment.websiteTitle}`,
        path: 'flows',
        pathMatch: 'full',
        component: FlowsTableComponent,
        resolve: {
          [ARE_THERE_FLOWS_FLAG]: AreThereFlowsResovler,
          folders: FoldersResolver,
        },
      },
    ],
  },
];
