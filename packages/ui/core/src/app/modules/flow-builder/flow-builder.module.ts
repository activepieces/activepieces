import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlowLayoutRouting } from './flow-builder.routing';
import { CollectionBuilderComponent } from './page/flow-builder/collection-builder.component';
import { MaterialLayoutModule } from '../common/common-layout.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorService } from './service/interceptor.service';
import { MatTabsModule } from '@angular/material/tabs';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderHeaderModule } from '@activepieces/ui/feature-builder-header';
import { UiFeatureBuilderLeftSidebarModule } from '@activepieces/ui/feature-builder-left-sidebar';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';
import { UiFeatureBuilderCanvasModule } from '@activepieces/ui/feature-builder-canvas';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { UiFeatureBuilderRightSidebarModule } from '@activepieces/ui/feature-builder-right-sidebar';
import { PortalModule } from '@angular/cdk/portal';
import { UiFeatureTemplatesModule } from '@activepieces/ui/feature-templates';
import { TimeagoModule } from 'ngx-timeago';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(FlowLayoutRouting),
    FormsModule,
    ReactiveFormsModule,
    MaterialLayoutModule,
    UiCommonModule,
    CodemirrorModule,
    DragDropModule,
    AngularSvgIconModule.forRoot(),
    TimeagoModule.forRoot(),
    FontAwesomeModule,
    MatExpansionModule,
    MonacoEditorModule,
    MatTabsModule,
    UiFeatureBuilderLeftSidebarModule,
    UiFeatureBuilderHeaderModule,
    UiFeatureBuilderStoreModule,
    UiFeatureBuilderCanvasModule,
    UiFeatureBuilderFormControlsModule,
    UiFeatureBuilderRightSidebarModule,
    PortalModule,
    UiFeatureTemplatesModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
  ],
  declarations: [CollectionBuilderComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [],
})
export class FlowBuilderModule {}
