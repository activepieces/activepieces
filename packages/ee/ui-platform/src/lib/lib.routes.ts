import { Route } from '@angular/router';
import { PlatformComponent } from './components/platform/platform.component';
import { platformResolver } from './platform.resolver';
import { ProjectsTableComponent } from './components/projects-table/projects-table.component';
import { PlatformAppearanceComponent } from './components/platform-appearance/platform-appearance.component';
import { PlatformSettingsComponent } from './components/platform-settings/platform-settings.component';

export const uiEePlatformRoutes: Route[] = [
  {
    path: '',
    component: PlatformComponent,
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
        path: 'settings',
        component: PlatformSettingsComponent,
        data: {
          title: $localize`Settings`,
        },
      },
    ],
  },
];
