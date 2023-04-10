import { Routes } from '@angular/router';
import { RunsTableComponent } from './pages/runs-table/runs-table.component';
import { CollectionsTableComponent } from './pages/collections-table/collections-table.component';
import {
  ARE_THERE_COLLECTIONS_FLAG,
  AreThereCollectionsResovler,
} from './resolvers/are-there-collections.resolver';
import { ConnectionsTableComponent } from './pages/connections-table/connections-table.component';
export const DashboardLayoutRouting: Routes = [
  {
    path: '',
    canActivate: [],
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/flows' },
      {
        title: 'AP-Runs',
        path: 'runs',
        pathMatch: 'full',
        component: RunsTableComponent,
      },
      {
        title: 'AP-Connections',
        path: 'connections',
        pathMatch: 'full',
        component: ConnectionsTableComponent,
      },
      {
        title: 'AP-Flows',
        path: 'flows',
        pathMatch: 'full',
        component: CollectionsTableComponent,
        resolve: { [ARE_THERE_COLLECTIONS_FLAG]: AreThereCollectionsResovler },
      },
    ],
  },
];
