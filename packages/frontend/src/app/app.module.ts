import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlowBuilderModule } from './modules/flow-builder/flow-builder.module';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../environments/environment';
import { JwtModule } from '@auth0/angular-jwt';
import { tokenGetter } from './modules/common/helper/helpers';
import { NotFoundComponent } from './modules/not-found/not-found.component';
import { RedirectUrlComponent } from './modules/redirect-url/redirect-url.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CommonModule } from '@angular/common';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

@NgModule({
	declarations: [AppComponent, NotFoundComponent, RedirectUrlComponent],
	imports: [
		CommonModule,
		BrowserModule,
		FlowBuilderModule,
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
		AngularSvgIconModule,
	],
	providers: [],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	exports: [],
	bootstrap: [AppComponent],
})
export class AppModule {}

function extractHostname(url: string): string {
	// for relative urls we should return empty string
	if(url.startsWith("/")){
	  return "";
	}
	const parsedUrl = new URL(url);;
	if(parsedUrl.port.length > 0){
		return parsedUrl.hostname + ":" + parsedUrl.port;
	}
	return parsedUrl.host;
}