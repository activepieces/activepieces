import { Routes } from '@angular/router';
import { CollectionBuilderComponent } from './page/flow-builder/collection-builder.component';
import { UserLoggedIn } from '../../guards/user-logged-in.guard';
import { GetInstanceRunResolver } from './resolvers/instance-run.resolver';
import { GetFlowResolver } from './resolvers/flow.resolver';
import { InstanceResolver as GetInstanceResolver } from './resolvers/instance.resolver';
import { ConnectionsResolver } from '@activepieces/ui/common';
import { BuilderSavingGuard } from '../../guards/builder-saving.guard';
import {
  isThereAnyNewFeaturedTemplatesResolver,
  isThereAnyNewFeaturedTemplatesResolverKey,
} from '@activepieces/ui/common';

export const FlowLayoutRouting: Routes = [
  {
    path: 'flows/:id',
    component: CollectionBuilderComponent,
    resolve: {
      flowAndFolder: GetFlowResolver,
      instanceData: GetInstanceResolver,
      connections: ConnectionsResolver,
      [isThereAnyNewFeaturedTemplatesResolverKey]:
        isThereAnyNewFeaturedTemplatesResolver,
    },
    canActivate: [UserLoggedIn],
    canDeactivate: [BuilderSavingGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'runs/:runId',
    component: CollectionBuilderComponent,
    resolve: {
      runInformation: GetInstanceRunResolver,
      connections: ConnectionsResolver,
    },
    canActivate: [UserLoggedIn],
  },
];
