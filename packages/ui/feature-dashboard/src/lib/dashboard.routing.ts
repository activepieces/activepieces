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
import { CommunityPiecesTableComponent } from './pages/community-pieces-table/community-pieces-table.component';
import { environment } from '@activepieces/ui/common';

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
        title: `My Pieces - ${environment.websiteTitle}`,
        path: 'settings/my-pieces',
        pathMatch: 'full',
        component: CommunityPiecesTableComponent,
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
    ],
  },
];
