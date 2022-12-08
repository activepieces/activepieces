import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlowLayoutModule } from './layout/flow-builder/flow-layout.module';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../environments/environment';
import { JwtModule } from '@auth0/angular-jwt';
import { tokenGetter } from './layout/common-layout/helper/helpers';
import { NotFoundComponent } from './layout/not-found/not-found.component';
import { RedirectUrlComponent } from './layout/redirect-url/redirect-url.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { HttpInterceptorProvider } from './service/http-interceptor.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CommonModule } from '@angular/common';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

@NgModule({
	declarations: [AppComponent, NotFoundComponent, RedirectUrlComponent],
	imports: [
		CommonModule,
		BrowserModule,
		FlowLayoutModule,
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
				allowedDomains: [environment.apiDomainUrl],
			},
		}),
		AngularSvgIconModule,
	],
	providers: [HttpInterceptorProvider],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	exports: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
