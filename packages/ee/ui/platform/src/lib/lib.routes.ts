import { Route } from '@angular/router';
import { PlatformDashboardContainerComponent } from './pages/platform-dashboard-container/platform-dashboard-container.component';
import {
  PLATFORM_RESOLVER_KEY,
  PlatformResolver,
} from '@activepieces/ui/common';
import { ProjectsTableComponent } from './pages/projects-table/projects-table.component';
import { PlatformAppearanceComponent } from './pages/platform-appearance/platform-appearance.component';
import { PlatformSettingsComponent } from './pages/platform-settings/platform-settings.component';
import { PiecesTableComponent } from './pages/pieces-table/pieces-table.component';
import { TemplatesTableComponent } from './pages/templates-table/templates-table.component';
import { UsersTableComponent } from './pages/users-table/users-table.component';
import {
  SIGNING_KEY_DISABLED_RESOLVER_KEY,
  APPEARANCE_DISABLED_RESOLVER_KEY,
  SigningKeyDisabledResolver as signingKeyDisabledResolver,
  appearanceDisabledResolver,
  MANAGE_PROJECTS_DISABLED_RESOLVER_KEY,
  manageProjectsResolver,
  MANAGE_PIECES_DISABLED_RESOLVER_KEY,
  managePiecesResolver,
  MANAGE_TEMPLATES_DISABLED_RESOLVER_KEY,
  manageTemplatesResolver,
  AUDIT_LOG_DISABLED_RESOLVER_KEY,
  auditLogDisabledResolver,
  CUSTOM_DOMAINS_DISABLED_RESOLVER_KEY,
  customDomainsDisabledResolver,
} from '@activepieces/ui/common';

export const uiEePlatformRoutes: Route[] = [
  {
    path: '',
    component: PlatformDashboardContainerComponent,
    children: [
      {
        path: '',
        pathMatch: 'prefix',
        redirectTo: 'projects',
      },
      {
        path: 'projects',
        component: ProjectsTableComponent,
        data: {
          title: $localize`Projects`,
        },
        resolve: {
          [MANAGE_PROJECTS_DISABLED_RESOLVER_KEY]: manageProjectsResolver,
        },
      },
      {
        path: 'appearance',
        component: PlatformAppearanceComponent,
        data: {
          title: $localize`Appearance`,
        },
        resolve: {
          [PLATFORM_RESOLVER_KEY]: PlatformResolver,
          [APPEARANCE_DISABLED_RESOLVER_KEY]: appearanceDisabledResolver,
        },
      },
      {
        path: 'pieces',
        component: PiecesTableComponent,
        data: {
          title: $localize`Pieces`,
        },
        resolve: {
          [PLATFORM_RESOLVER_KEY]: PlatformResolver,
          [MANAGE_PIECES_DISABLED_RESOLVER_KEY]: managePiecesResolver,
        },
      },
      {
        path: 'templates',
        component: TemplatesTableComponent,
        data: {
          title: $localize`Templates`,
        },
        resolve: {
          [MANAGE_TEMPLATES_DISABLED_RESOLVER_KEY]: manageTemplatesResolver,
        },
      },
      {
        path: 'settings',
        component: PlatformSettingsComponent,
        data: {
          title: $localize`Settings`,
        },
        resolve: {
          [PLATFORM_RESOLVER_KEY]: PlatformResolver,
          [SIGNING_KEY_DISABLED_RESOLVER_KEY]: signingKeyDisabledResolver,
          [APPEARANCE_DISABLED_RESOLVER_KEY]: appearanceDisabledResolver,
          [AUDIT_LOG_DISABLED_RESOLVER_KEY]: auditLogDisabledResolver,
          [CUSTOM_DOMAINS_DISABLED_RESOLVER_KEY]: customDomainsDisabledResolver,
        },
      },
      {
        path: 'users',
        component: UsersTableComponent,
        data: {
          title: $localize`Users`,
        },
      },
    ],
  },
];
