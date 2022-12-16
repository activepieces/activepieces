import { Routes } from '@angular/router';
import { RunsComponent } from './pages/runs/runs.component';
import { CollectionComponent } from './pages/collections/collection-components.component';
import { ListCollectionResolver } from './resolvers/list-collections-resolver.service';
import { ListInstancesRunResolver } from './resolvers/list-instances-runs.resolver';

export const DashboardLayoutRouting: Routes = [
	{
		path: '',
		canActivate: [],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: '/flows' },
			{
				path: 'runs',
				pathMatch: 'full',
				component: RunsComponent,
				resolve: { runs: ListInstancesRunResolver },
				runGuardsAndResolvers: 'paramsOrQueryParamsChange',
			},

			{
				path: 'flows',
				pathMatch: 'full',
				component: CollectionComponent,
				resolve: {
					collections: ListCollectionResolver,
				},
			},
		],
	},
];
