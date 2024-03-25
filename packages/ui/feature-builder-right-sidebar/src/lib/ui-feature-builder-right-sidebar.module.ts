import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderTestStepsModule } from '@activepieces/ui/feature-builder-test-steps';
import { EditStepFormContainerComponent as EditStepFormContainerComponent } from './edit-step-sidebar/edit-step-form-container/edit-step-form-container.component';
import { StepNameEditorComponent } from './edit-step-sidebar/step-name-editor/step-name-editor.component';
import { BranchStepInputFormComponent } from './input-forms/branch-step-input-form/branch-step-input-form.component';
import { CodeStepInputFormComponent } from './input-forms/code-step-input-form/code-step-input-form.component';
import { LoopStepInputFormComponent } from './input-forms/loop-step-input-form/loop-step-input-form.component';
import { StepTypeListComponent } from './step-type-sidebar/step-type-list/step-type-list.component';
import { StepTypeSidebarComponent } from './step-type-sidebar/step-type-sidebar.component';
import { StepTypeItemComponent } from './step-type-sidebar/step-type-item/step-type-item.component';
import { MatTabsModule } from '@angular/material/tabs';
import { FlowRightSidebarComponent } from './flow-right-sidebar.component';
import { EditStepSidebarComponent } from './edit-step-sidebar/edit-step-sidebar.component';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { CodeWriterDialogComponent } from './input-forms/code-step-input-form/code-writer-dialog/code-writer-dialog.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { PieceInputFormComponent } from './input-forms/piece-input-form/piece-input-form.component';
@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    UiFeatureBuilderFormControlsModule,
    MatTabsModule,
    UiFeatureBuilderTestStepsModule,
    MatStepperModule,
    MatChipsModule,
    PieceInputFormComponent,
  ],
  declarations: [
    EditStepFormContainerComponent,
    StepNameEditorComponent,
    BranchStepInputFormComponent,
    CodeStepInputFormComponent,
    LoopStepInputFormComponent,
    StepTypeListComponent,
    StepTypeSidebarComponent,
    StepTypeItemComponent,
    FlowRightSidebarComponent,
    EditStepSidebarComponent,
    CodeWriterDialogComponent,
  ],
  exports: [FlowRightSidebarComponent],
})
export class UiFeatureBuilderRightSidebarModule {}
