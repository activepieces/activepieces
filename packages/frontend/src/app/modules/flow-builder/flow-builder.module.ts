import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlowLayoutRouting } from './flow-builder.routing';
import { CollectionBuilderComponent } from './page/flow-builder/collection-builder.component';
import { FlowItemComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item.component';
import { FlowRightSidebarComponent } from './page/flow-builder/flow-right-sidebar/flow-right-sidebar.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlowItemTreeComponent } from './page/flow-builder/flow-item-tree/flow-item-tree.component';
import { SimpleLineConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/simple-line-connection/simple-line-connection.component';
import { LoopLineConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/loop-line-connection/loop-line-connection.component';
import { NewEditPieceSidebarComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-sidebar.component';
import { StepTypeSidebarComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-sidebar.component';
import { StepTypItemComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/step-type-item.component';
import { StepTypeListComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-list/step-type-list.component';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlowItemConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/flow-item-connection.component';
import { FlowItemContentComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-content/flow-item-content.component';
import { EditStepAccordionComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/edit-step-accodion.component';
import { CodeStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/code-step-input-form/code-step-input-form.component';
import { LoopStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/loop-step-input-form/loop-step-input-form.component';
import { OAuth2ConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/oauth2-connection-dialog/oauth2-connection-dialog.component';
import { PieceActionInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/piece-action-input-form/piece-action-input-form.component';
import { PieceTriggerInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/piece-trigger-input-form/piece-trigger-input-form.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorService } from './service/interceptor.service';
import { MatTabsModule } from '@angular/material/tabs';
import { DeleteStepDialogComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-content/delete-step-dialog/delete-step-dialog.component';
import { CloudOAuth2ConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/cloud-oauth2-connection-dialog/cloud-oauth2-connection-dialog.component';
import { SecretTextConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/secret-text-connection-dialog/secret-text-connection-dialog.component';
import { BasicAuthConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/basic-auth-connection-dialog/basic-auth-connection-dialog.component';
import { BranchLineConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/branch-line-connection/branch-line-connection.component';
import { CanvasPannerDirective } from './page/flow-builder/canvas-utils/panning/panner.directive';
import { BranchStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/branch-step-input-form/branch-step-input-form.component';
import { CanvasUtilsComponent } from './page/flow-builder/canvas-utils/canvas-utils.component';
import { TestingStepsAndTriggersModule } from '../testing-steps-and-triggers/testing-steps-and-triggers.module';
import { StepNameEditorComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/step-name-editor/step-name-editor.component';
import { CustomAuthConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/custom-auth-connection-dialog/custom-auth-connection-dialog.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderTabsModule } from '@activepieces/ui/feature-builder-tabs';
import { UiFeatureBuilderHeaderModule } from '@activepieces/ui/feature-builder-header';
import { UiFeautreBuilderLeftSidebarModule } from '@activepieces/ui/feautre-builder-left-sidebar';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(FlowLayoutRouting),
    FormsModule,
    ReactiveFormsModule,
    CommonLayoutModule,
    UiCommonModule,
    CodemirrorModule,
    DragDropModule,
    AngularSvgIconModule.forRoot(),
    FontAwesomeModule,
    MatExpansionModule,
    MonacoEditorModule,
    MatTabsModule,
    TestingStepsAndTriggersModule,
    UiFeatureBuilderTabsModule,
    UiFeautreBuilderLeftSidebarModule,
    UiFeatureBuilderHeaderModule,
    UiFeatureBuilderStoreModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
  ],
  declarations: [
    CollectionBuilderComponent,
    FlowItemComponent,
    FlowRightSidebarComponent,
    FlowItemTreeComponent,
    FlowItemConnectionComponent,
    FlowItemContentComponent,
    NewEditPieceSidebarComponent,
    StepTypItemComponent,
    StepTypeListComponent,
    StepTypeSidebarComponent,
    SimpleLineConnectionComponent,
    LoopLineConnectionComponent,
    EditStepAccordionComponent,
    LoopStepInputFormComponent,
    CodeStepInputFormComponent,
    PieceActionInputFormComponent,
    OAuth2ConnectionDialogComponent,
    PieceTriggerInputFormComponent,
    DeleteStepDialogComponent,
    CloudOAuth2ConnectionDialogComponent,
    SecretTextConnectionDialogComponent,
    BasicAuthConnectionDialogComponent,
    BranchLineConnectionComponent,
    CanvasPannerDirective,
    BranchStepInputFormComponent,
    CanvasUtilsComponent,
    StepNameEditorComponent,
    CustomAuthConnectionDialogComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [],
})
export class FlowBuilderModule {}
