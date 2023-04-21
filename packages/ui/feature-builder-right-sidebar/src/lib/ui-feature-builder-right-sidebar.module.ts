import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderTestStepsModule } from '@activepieces/ui/feature-builder-test-steps';
import { EditStepFormContainerComponent as EditStepFormContainerComponent } from './flow-right-sidebar/edit-step-sidebar/edit-step-form-container/edit-step-form-container.component';
import { StepNameEditorComponent } from './flow-right-sidebar/edit-step-sidebar/step-name-editor/step-name-editor.component';
import { BranchStepInputFormComponent } from './flow-right-sidebar/input-forms/branch-step-input-form/branch-step-input-form.component';
import { CodeStepInputFormComponent } from './flow-right-sidebar/input-forms/code-step-input-form/code-step-input-form.component';
import { LoopStepInputFormComponent } from './flow-right-sidebar/input-forms/loop-step-input-form/loop-step-input-form.component';
import { PieceActionInputFormComponent } from './flow-right-sidebar/input-forms/piece-input-forms/piece-action-input-form/piece-action-input-form.component';
import { PieceTriggerInputFormComponent } from './flow-right-sidebar/input-forms/piece-input-forms/piece-trigger-input-form/piece-trigger-input-form.component';
import { StepTypeListComponent } from './flow-right-sidebar/step-type-sidebar/step-type-list/step-type-list.component';
import { StepTypeSidebarComponent } from './flow-right-sidebar/step-type-sidebar/step-type-sidebar.component';
import { StepTypeItemComponent } from './flow-right-sidebar/step-type-sidebar/step-type-item/step-type-item.component';
import { MatTabsModule } from '@angular/material/tabs';
import { FlowRightSidebarComponent } from './flow-right-sidebar/flow-right-sidebar.component';
import { NewEditPieceSidebarComponent } from './flow-right-sidebar/edit-step-sidebar/edit-step-sidebar.component';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    UiFeatureBuilderFormControlsModule,
    MatTabsModule,
    UiFeatureBuilderTestStepsModule,
  ],
  declarations: [
    EditStepFormContainerComponent,
    StepNameEditorComponent,
    BranchStepInputFormComponent,
    CodeStepInputFormComponent,
    LoopStepInputFormComponent,
    PieceActionInputFormComponent,
    PieceTriggerInputFormComponent,
    StepTypeListComponent,
    StepTypeSidebarComponent,
    StepTypeItemComponent,
    FlowRightSidebarComponent,
    NewEditPieceSidebarComponent,
  ],
  exports: [FlowRightSidebarComponent],
})
export class UiFeatureBuilderRightSidebarModule {}
