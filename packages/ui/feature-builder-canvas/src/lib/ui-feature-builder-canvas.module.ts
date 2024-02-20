import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { FlowItemComponent } from './components/flow-item-tree/flow-item/flow-item.component';
import { FlowItemContentComponent } from './components/flow-item-tree/flow-item/flow-item-content/flow-item-content.component';
import { FlowItemTreeComponent } from './components/flow-item-tree/flow-item-tree.component';
import { DeleteStepDialogComponent } from './components/flow-item-tree/flow-item/actions/delete-flow-item-action/delete-step-dialog/delete-step-dialog.component';
import { IncompleteStepsWidgetComponent } from './components/widgets/incomplete-steps-widget/incomplete-steps-widget.component';
import { DragAndDropModule } from 'angular-draggable-droppable';
import { DropZoneComponent } from './components/flow-item-tree/flow-item/flow-item-connection/drop-zone/drop-zone.component';
import { SmallAddButtonComponent } from './components/flow-item-tree/flow-item/flow-item-connection/small-add-button/small-add-button.component';
import { BigAddButtonComponent } from './components/flow-item-tree/flow-item/flow-item-connection/big-add-button/big-add-button.component';
import { TestFlowWidgetComponent } from './components/widgets/test-flow-widget/test-flow-widget.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { ViewOnlyModeComponent } from './components/widgets/view-only-mode-widget/view-only-mode-widget.component';
import { DeleteFlowItemActionComponent } from './components/flow-item-tree/flow-item/actions/delete-flow-item-action/delete-flow-item-action.component';
import { ReplaceTriggerActionComponent } from './components/flow-item-tree/flow-item/actions/replace-trigger-action/replace-trigger-action.component';
import { ActionsContainerComponent } from './components/flow-item-tree/flow-item/actions/actions-container/actions-container.component';
import { DuplicateStepActionComponent } from './components/flow-item-tree/flow-item/actions/duplicate-step-action/duplicate-step-action.component';
import { UiFeaturePiecesModule } from '@activepieces/ui/feature-pieces';
import { EndfOfFlowWidgetComponent } from './components/widgets/end-of-flow-widget/end-of-flow-widget.component';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    DragAndDropModule,
    CodemirrorModule,
    UiFeaturePiecesModule,
  ],
  declarations: [
    FlowItemComponent,
    FlowItemContentComponent,
    FlowItemTreeComponent,
    DeleteStepDialogComponent,
    IncompleteStepsWidgetComponent,
    DropZoneComponent,
    SmallAddButtonComponent,
    BigAddButtonComponent,
    TestFlowWidgetComponent,
    ViewOnlyModeComponent,
    DeleteFlowItemActionComponent,
    ReplaceTriggerActionComponent,
    ActionsContainerComponent,
    DuplicateStepActionComponent,
    EndfOfFlowWidgetComponent,
  ],
  exports: [FlowItemTreeComponent],
})
export class UiFeatureBuilderCanvasModule {}
