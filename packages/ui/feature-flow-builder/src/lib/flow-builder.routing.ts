import { Routes } from '@angular/router';
import { FlowBuilderComponent } from './page/flow-builder/flow-builder.component';
import { GetInstanceRunResolver } from './resolvers/instance-run.resolver';
import { GetFlowResolver } from './resolvers/flow.resolver';
import { UserLoggedInGuard } from '@activepieces/ui/common';
import { BuilderSavingGuard } from './guards/builder-saving.guard';
import { FoldersResolver } from '@activepieces/ui/feature-folders-store';
import { flowDisplayNameInRouteData } from './resolvers/builder-route-data';

export const FlowLayoutRouting: Routes = [
  {
    path: 'flows/:id',
    component: FlowBuilderComponent,
    resolve: {
      [flowDisplayNameInRouteData]: GetFlowResolver,
      folders: FoldersResolver,
    },
    canActivate: [UserLoggedInGuard],
    canDeactivate: [BuilderSavingGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'runs/:runId',
    component: FlowBuilderComponent,
    resolve: {
      [flowDisplayNameInRouteData]: GetInstanceRunResolver, 
    },
    canActivate: [UserLoggedInGuard],
  },
];
