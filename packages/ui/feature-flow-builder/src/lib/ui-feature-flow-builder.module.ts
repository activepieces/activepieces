import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FlowLayoutRouting } from './flow-builder.routing';
import { FlowBuilderComponent } from './page/flow-builder/flow-builder.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderHeaderModule } from '@activepieces/ui-feature-builder-header';
import { UiFeatureBuilderLeftSidebarModule } from '@activepieces/ui/feature-builder-left-sidebar';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';
import { UiFeatureBuilderCanvasModule } from '@activepieces/ui/feature-builder-canvas';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { UiFeatureBuilderRightSidebarModule } from '@activepieces/ui/feature-builder-right-sidebar';
import { PortalModule } from '@angular/cdk/portal';
import { UiFeatureTemplatesModule } from '@activepieces/ui/feature-templates';
import { TimeagoModule } from 'ngx-timeago';
import { UiFeatureFoldersStoreModule } from '@activepieces/ui/feature-folders-store';
import { UiCanvasUtilsModule } from '@activepieces/ui-canvas-utils';
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(FlowLayoutRouting),
    UiCommonModule,
    CodemirrorModule,
    DragDropModule,
    AngularSvgIconModule.forRoot(),
    TimeagoModule.forRoot(),
    MatExpansionModule,
    UiFeatureBuilderStoreModule,
    UiFeatureBuilderLeftSidebarModule,
    UiFeatureBuilderHeaderModule,
    UiFeatureBuilderCanvasModule,
    UiFeatureBuilderFormControlsModule,
    UiFeatureBuilderRightSidebarModule,
    UiFeatureFoldersStoreModule,
    PortalModule,
    UiFeatureTemplatesModule,
    UiCanvasUtilsModule
  ],
  declarations: [FlowBuilderComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [],
})
export class UiFeatureFlowBuilderModule { }
