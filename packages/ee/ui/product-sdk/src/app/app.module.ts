import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { LoadingSpinnerDirective } from './directives/loading-spinner.directive';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { EnableIntegrationModalComponent } from './enable-integration-modal/enable-integration-modal.component';
import { DisableIntegrationModalComponent } from './disable-integration-modal/disable-integration-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CdkOverlayContainerDirective } from './over-directive';
import { CdkOverlayContainer } from './custom-overlay-container';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

export const componentsAndTheirElementTagNames = [
  {
    component: AppComponent,
    tagName: 'ap-sdk',
  },
];

@NgModule({
  declarations: [
    AppComponent,
    LoadingSpinnerDirective,
    LoadingSpinnerComponent,
    EnableIntegrationModalComponent,
    DisableIntegrationModalComponent,
    CdkOverlayContainerDirective,
  ],
  imports: [
    MatButtonModule,
    MatDialogModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    AngularSvgIconModule.forRoot(),
    ReactiveFormsModule,
  ],
  providers: [
    AppComponent,
    { provide: OverlayContainer, useClass: CdkOverlayContainer },
  ],
  schemas: [],
  exports: [],
})
export class AppModule implements DoBootstrap {
  constructor(private injector: Injector) {}

  ngDoBootstrap() {
    for (const webElement of componentsAndTheirElementTagNames) {
      this.createWebElement(
        webElement.component,
        webElement.tagName,
        this.injector
      );
    }
  }

  createWebElement(component: any, tagName: string, injector: Injector) {
    const webComponent = createCustomElement(component, { injector });
    if (customElements.get(tagName)) {
      console.warn(`${tagName} has been defined twice`);
    } else {
      customElements.define(tagName, webComponent);
    }
  }
}
