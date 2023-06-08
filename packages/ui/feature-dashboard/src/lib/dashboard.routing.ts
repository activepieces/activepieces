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
export const DashboardLayoutRouting: Routes = [
  {
    path: '',
    canActivate: [],
    component: DashboardContainerComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/flows' },
      {
        title: 'Runs - Activepieces',
        path: 'runs',
        pathMatch: 'full',
        component: RunsTableComponent,
      },
      {
        title: 'Connections - Activepieces',
        path: 'connections',
        pathMatch: 'full',
        component: ConnectionsTableComponent,
      },
      {
        title: 'Flows - Activepieces',
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
