import { Routes } from '@angular/router';
import { RunsComponent } from './pages/runs/runs.component';
import { CollectionsTableComponent } from './pages/collections/collections-table.component';
import { ListInstancesRunResolver } from './resolvers/list-instances-runs.resolver';
import { AreThereCollectionsResovler } from './resolvers/are-there-collections.resolver';
export const ARE_THERE_COLLECTIONS_FLAG = 'areThereCollections';
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
				component: RunsComponent,
				resolve: { runs: ListInstancesRunResolver },
				runGuardsAndResolvers: 'paramsOrQueryParamsChange',
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
