import {
  APP_INITIALIZER,
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlowBuilderModule } from './modules/flow-builder/flow-builder.module';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UiCommonModule, environment } from '@activepieces/ui/common';
import { JwtModule } from '@auth0/angular-jwt';
import { NotFoundComponent } from './modules/not-found/not-found.component';
import { RedirectUrlComponent } from './modules/redirect-url/redirect-url.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CommonModule } from '@angular/common';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { CommonLayoutModule } from './modules/common/common-layout.module';
import { FirebaseAuthLayoutModule } from '../../../../ee/firebase-auth/frontend/firebase-auth.module';
import { Route, Router } from '@angular/router';
import { FlagService } from '@activepieces/ui/common';
import { ApEdition } from '@activepieces/shared';
import { FirebaseAuthContainerComponent } from '@ee/firebase-auth/frontend/auth-container/firebase-auth-container.component';
import { UserLoggedIn } from './guards/user-logged-in.guard';
import { DashboardContainerComponent } from '@activepieces/ui/feature-dashboard';
import { FeatureCommandBarModule } from '@activepieces/ui/feature-command-bar';
import { AuthLayoutComponent } from '@activepieces/ui/feature-authentication';
import { ImportFlowComponent } from './modules/import-flow/import-flow.component';

export function tokenGetter() {
  const jwtToken: any = localStorage.getItem(environment.jwtTokenName);

  return jwtToken;
}

@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    RedirectUrlComponent,
    ImportFlowComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    FlowBuilderModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FeatureCommandBarModule,
    StoreModule.forRoot({}),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
    }),
    EffectsModule.forRoot(),
    HttpClientModule,
    FontAwesomeModule,
    JwtModule.forRoot({
      config: {
        tokenGetter,
        allowedDomains: [extractHostname(environment.apiUrl)],
      },
    }),
    ...dynamicModules(),
    AngularSvgIconModule,
    CommonLayoutModule,
    UiCommonModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppCustomLogic,
      multi: true,
      deps: [Router, FlagService],
    },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function initializeAppCustomLogic(
  router: Router,
  flagService: FlagService
): () => Promise<void> {
  return () =>
    new Promise((resolve) => {
      flagService.getEdition().subscribe((edition) => {
        console.log('AP Edition ' + edition);
        router.resetConfig([...dynamicRoutes(edition)]);
        resolve();
      });
    });
}

function dynamicRoutes(edition: string) {
  const coreRoutes: Route[] = [
    {
      path: '',
      component: DashboardContainerComponent,
      canActivate: [UserLoggedIn],
      children: [
        {
          path: '',
          loadChildren: () =>
            import('@activepieces/ui/feature-dashboard').then(
              (m) => m.UiFeatureDashboardModule
            ),
        },
      ],
    },
    {
      path: '',
      children: [
        {
          path: '',
          loadChildren: () =>
            import('./modules/flow-builder/flow-builder.module').then(
              (m) => m.FlowBuilderModule
            ),
        },
      ],
    },
  ];
  const suffixRoutes: Route[] = [
    {
      canActivate: [UserLoggedIn],
      path: 'templates/:templateId',
      component: ImportFlowComponent,
    },
    {
      path: 'redirect',
      component: RedirectUrlComponent,
    },
    {
      path: '**',
      component: NotFoundComponent,
      title: 'AP-404',
    },
  ];
  let editionRoutes: Route[] = [];
  switch (edition) {
    case ApEdition.ENTERPRISE:
      editionRoutes = [
        {
          path: '',
          component: FirebaseAuthContainerComponent,
          children: [
            {
              path: '',
              loadChildren: () =>
                import(
                  '../../../../ee/firebase-auth/frontend/firebase-auth.module'
                ).then((m) => m.FirebaseAuthLayoutModule),
            },
          ],
        },
      ];
      break;
    case ApEdition.COMMUNITY:
      editionRoutes = [
        {
          path: '',
          component: AuthLayoutComponent,
          children: [
            {
              path: '',
              loadChildren: () =>
                import('@activepieces/ui/feature-authentication').then(
                  (m) => m.UiFeatureAuthenticationModule
                ),
            },
          ],
        },
      ];
      break;
  }
  return [...coreRoutes, ...editionRoutes, ...suffixRoutes];
}

function dynamicModules() {
  return [FirebaseAuthLayoutModule];
}

function extractHostname(url: string): string {
  // for relative urls we should return empty string
  if (url.startsWith('/')) {
    return '';
  }
  const parsedUrl = new URL(url);
  if (parsedUrl.port.length > 0) {
    return parsedUrl.hostname + ':' + parsedUrl.port;
  }
  return parsedUrl.host;
}
