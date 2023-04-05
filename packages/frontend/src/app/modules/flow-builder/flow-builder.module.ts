import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlowLayoutRouting } from './flow-builder.routing';
import { CollectionBuilderComponent } from './page/flow-builder/collection-builder.component';
import { FlowRightSidebarComponent } from './page/flow-builder/flow-right-sidebar/flow-right-sidebar.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NewEditPieceSidebarComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-sidebar.component';
import { StepTypeSidebarComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-sidebar.component';
import { StepTypItemComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/step-type-item.component';
import { StepTypeListComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-list/step-type-list.component';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditStepAccordionComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/edit-step-accodion.component';
import { CodeStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/code-step-input-form/code-step-input-form.component';
import { LoopStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/loop-step-input-form/loop-step-input-form.component';
import { PieceActionInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/piece-action-input-form/piece-action-input-form.component';
import { PieceTriggerInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/piece-trigger-input-form/piece-trigger-input-form.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorService } from './service/interceptor.service';
import { MatTabsModule } from '@angular/material/tabs';
import { BranchStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/branch-step-input-form/branch-step-input-form.component';
import { TestingStepsAndTriggersModule } from '../testing-steps-and-triggers/testing-steps-and-triggers.module';
import { StepNameEditorComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/step-name-editor/step-name-editor.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderTabsModule } from '@activepieces/ui/feature-builder-tabs';
import { UiFeatureBuilderHeaderModule } from '@activepieces/ui/feature-builder-header';
import { UiFeautreBuilderLeftSidebarModule } from '@activepieces/ui/feautre-builder-left-sidebar';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';
import { UiFeatureBuilderCanvasModule } from '@activepieces/ui/feature-builder-canvas';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';

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
    UiFeatureBuilderCanvasModule,
    UiFeatureBuilderFormControlsModule,
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
    FlowRightSidebarComponent,
    NewEditPieceSidebarComponent,
    StepTypItemComponent,
    StepTypeListComponent,
    StepTypeSidebarComponent,
    EditStepAccordionComponent,
    LoopStepInputFormComponent,
    CodeStepInputFormComponent,
    PieceActionInputFormComponent,
    PieceTriggerInputFormComponent,
    BranchStepInputFormComponent,
    StepNameEditorComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [],
})
export class FlowBuilderModule {}
