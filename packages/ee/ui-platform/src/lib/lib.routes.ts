import { Route } from '@angular/router';
import { PlatformComponent } from './components/platform/platform.component';
import { platformResolver } from './platform.resolver';

export const uiEePlatformRoutes: Route[] = [
  {
    path: '',
    component: PlatformComponent,
    resolve: {
      platform: platformResolver,
    },
  },
];
