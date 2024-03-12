import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLoggedIn, showBasedOnEditionGuard } from '@activepieces/ui/common';
import { ImportFlowUriEncodedResolver } from './modules/import-flow-uri-encoded/import-flow-uri-encoded.resolver';
import { ImportFlowUriEncodedComponent } from './modules/import-flow-uri-encoded/import-flow-uri-encoded.component';
import { ImportFlowComponent } from './modules/import-flow/import-flow.component';
import { RedirectUrlComponent } from './modules/redirect-url/redirect-url.component';
import { NotFoundComponent } from './modules/not-found/not-found.component';
import {
  EmbedRedirectComponent,
  EmbeddedConnectionDialogComponent,
} from '@activepieces/ee-components';
import { ApEdition } from '@activepieces/shared';
import { FormsComponent } from './modules/forms/forms.component';

export const routes: Routes = [
  {
    path: 'import-flow-uri-encoded',
    canActivate: [UserLoggedIn, showBasedOnEditionGuard([ApEdition.CLOUD])],
    resolve: {
      combination: ImportFlowUriEncodedResolver,
    },
    component: ImportFlowUriEncodedComponent,
  },
  {
    path: 'templates/:templateId',
    component: ImportFlowComponent,
    data: {
      title: $localize`Import Flow`,
    },
    canActivate: [
      showBasedOnEditionGuard([ApEdition.ENTERPRISE, ApEdition.CLOUD]),
    ],
  },
  {
    path: 'redirect',
    component: RedirectUrlComponent,
  },
  {
    path: 'embed',
    component: EmbedRedirectComponent,
    canActivate: [
      showBasedOnEditionGuard([ApEdition.ENTERPRISE, ApEdition.CLOUD]),
    ],
  },
  {
    path: 'embed/connections',
    component: EmbeddedConnectionDialogComponent,
    canActivate: [
      showBasedOnEditionGuard([ApEdition.ENTERPRISE, ApEdition.CLOUD]),
      UserLoggedIn,
    ],
  },
  {
    canActivate: [UserLoggedIn],
    path: '',
    loadChildren: () =>
      import('@activepieces/ui/feature-dashboard').then(
        (m) => m.UiFeatureDashboardModule
      ),
  },
  {
    canActivate: [UserLoggedIn],
    path: '',
    loadChildren: () =>
      import('ui-feature-flow-builder').then(
        (m) => m.UiFeatureFlowBuilderModule
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('@activepieces/ee/project-members').then(
        (m) => m.EeProjectMembersModule
      ),
    canActivate: [
      showBasedOnEditionGuard([ApEdition.ENTERPRISE, ApEdition.CLOUD]),
    ],
  },

  {
    path: 'forms/:flowId',
    component: FormsComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
    data: {
      title: '404',
    },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      urlUpdateStrategy: 'eager',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
