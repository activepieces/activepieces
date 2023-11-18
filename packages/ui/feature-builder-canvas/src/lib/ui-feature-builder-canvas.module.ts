import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { FlowItemComponent } from './flow-item-tree/flow-item/flow-item.component';
import { FlowItemContentComponent } from './flow-item-tree/flow-item/flow-item-content/flow-item-content.component';
import { FlowItemTreeComponent } from './flow-item-tree/flow-item-tree.component';
import { CanvasUtilsComponent } from './canvas-utils/canvas-utils.component';
import { CanvasPannerDirective } from './canvas-utils/panning/panner.directive';
import { DeleteStepDialogComponent } from './flow-item-tree/flow-item/actions/delete-flow-item-action/delete-step-dialog/delete-step-dialog.component';
import { IncompleteStepsWidgetComponent } from './incomplete-steps-widget/incomplete-steps-widget.component';
import { DragAndDropModule } from 'angular-draggable-droppable';
import { DropZoneComponent } from './flow-item-tree/flow-item/flow-item-connection/drop-zone/drop-zone.component';
import { SmallAddButtonComponent } from './flow-item-tree/flow-item/flow-item-connection/small-add-button/small-add-button.component';
import { BigAddButtonComponent } from './flow-item-tree/flow-item/flow-item-connection/big-add-button/big-add-button.component';
import { TestFlowWidgetComponent } from './test-flow-widget/test-flow-widget.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { ViewOnlyModeComponent } from './view-only-mode/view-only-mode.component';
import { DeleteFlowItemActionComponent } from './flow-item-tree/flow-item/actions/delete-flow-item-action/delete-flow-item-action.component';
import { ReplaceTriggerActionComponent } from './flow-item-tree/flow-item/actions/replace-trigger-action/replace-trigger-action.component';
import { ActionsContainerComponent } from './flow-item-tree/flow-item/actions/actions-container/actions-container.component';
import { DuplicateStepActionComponent } from './flow-item-tree/flow-item/actions/duplicate-step-action/duplicate-step-action.component';
@NgModule({
  imports: [CommonModule, UiCommonModule, DragAndDropModule, CodemirrorModule],
  declarations: [
    FlowItemComponent,
    FlowItemContentComponent,
    FlowItemTreeComponent,
    CanvasUtilsComponent,
    DeleteStepDialogComponent,
    CanvasPannerDirective,
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
  ],
  exports: [FlowItemTreeComponent, CanvasUtilsComponent, CanvasPannerDirective],
})
export class UiFeatureBuilderCanvasModule {}
