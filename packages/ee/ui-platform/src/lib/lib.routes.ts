import { Route } from '@angular/router';
import { PlatformDashboardContainerComponent } from './pages/platform-dashboard-container/platform-dashboard-container.component';
import { platformResolver } from './platform.resolver';
import { ProjectsTableComponent } from './pages/projects-table/projects-table.component';
import { PlatformAppearanceComponent } from './pages/platform-appearance/platform-appearance.component';
import { PlatformSettingsComponent } from './pages/platform-settings/platform-settings.component';
import { PiecesTableComponent } from './pages/pieces-table/pieces-table.component';
import { TemplatesTableComponent } from './pages/templates-table/templates-table.component';
import { UsersTableComponent } from './pages/users-table/users-table.component';

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
      },
      {
        path: 'appearance',
        component: PlatformAppearanceComponent,
        data: {
          title: $localize`Appearance`,
        },
        resolve: {
          platform: platformResolver,
        },
      },
      {
        path: 'pieces',
        component: PiecesTableComponent,
        data: {
          title: $localize`Pieces`,
        },
        resolve: {
          platform: platformResolver,
        },
      },
      {
        path: 'templates',
        component: TemplatesTableComponent,
        data: {
          title: $localize`Templates`,
        },
        resolve: {
          platform: platformResolver,
        },
      },
      {
        path: 'settings',
        component: PlatformSettingsComponent,
        data: {
          title: $localize`Settings`,
        },
        resolve: {
          platform: platformResolver,
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
