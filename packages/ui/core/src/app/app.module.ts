import {
  APP_INITIALIZER,
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
import { MaterialLayoutModule } from './modules/common/common-layout.module';
import { Route, Router } from '@angular/router';
import { FlagService } from '@activepieces/ui/common';
import { ApEdition } from '@activepieces/shared';
import { UserLoggedIn } from './guards/user-logged-in.guard';
import { ImportFlowComponent } from './modules/import-flow/import-flow.component';
import { LottieCacheModule, LottieModule } from 'ngx-lottie';
import player from 'lottie-web';
import { ImportFlowBase64Component } from './modules/import-flow-base64/import-flow-base64.component';
import { ImportFlowBase64Resolver } from './modules/import-flow-base64/import-flow-base64.resolver';
import {
  MonacoEditorModule,
  NgxMonacoEditorConfig,
} from 'ngx-monaco-editor-v2';
import { apMonacoTheme } from './modules/common/monaco-themes/ap-monaco-theme';
import { cobalt2 } from './modules/common/monaco-themes/cobalt-2-theme';

const monacoConfig: NgxMonacoEditorConfig = {
  baseUrl: '/assets', // configure base path for monaco editor. Starting with version 8.0.0 it defaults to './assets'. Previous releases default to '/assets'
  defaultOptions: { scrollBeyondLastLine: false }, // pass default options to be used
  onMonacoLoad: () => {
    const monaco = (window as any).monaco;
    monaco.editor.defineTheme('apTheme', apMonacoTheme);
    monaco.editor.defineTheme('cobalt2', cobalt2);
  }, // here monaco object will be available as window.monaco use this function to extend monaco editor functionalities.
};
export function tokenGetter() {
  const jwtToken: any = localStorage.getItem(environment.jwtTokenName);
  return jwtToken;
}
// Note we need a separate function as it's required
// by the AOT compiler.
export function playerFactory() {
  return player;
}

@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    RedirectUrlComponent,
    ImportFlowComponent,
    ImportFlowBase64Component,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
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
    AngularSvgIconModule.forRoot(),
    MaterialLayoutModule,
    UiCommonModule,
    LottieModule.forRoot({ player: playerFactory }),
    LottieCacheModule.forRoot(),
    MonacoEditorModule.forRoot(monacoConfig),
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
      path: 'import-flow-64',
      canActivate: [UserLoggedIn],
      resolve: {
        combination: ImportFlowBase64Resolver,
      },
      component: ImportFlowBase64Component,
    },
    {
      path: 'templates/:templateId',
      component: ImportFlowComponent,
      title: `Import Flow - ${environment.websiteTitle}`,
    },
    {
      path: 'redirect',
      component: RedirectUrlComponent,
    },
    {
      path: '**',
      component: NotFoundComponent,
      title: `404 - ${environment.websiteTitle}`,
    },
  ];
  let editionRoutes: Route[] = [];
  switch (edition) {
    case ApEdition.CLOUD:
      editionRoutes = [];
      break;
    case ApEdition.ENTERPRISE:
      editionRoutes = [];
      break;
    case ApEdition.COMMUNITY:
      editionRoutes = [
        {
          path: '',
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
