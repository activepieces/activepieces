import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { BranchLineConnectionComponent } from './flow-item-tree/flow-item/flow-item-connection/branch-line-connection/branch-line-connection.component';
import { LoopLineConnectionComponent } from './flow-item-tree/flow-item/flow-item-connection/loop-line-connection/loop-line-connection.component';
import { SimpleLineConnectionComponent } from './flow-item-tree/flow-item/flow-item-connection/simple-line-connection/simple-line-connection.component';
import { FlowItemConnectionComponent } from './flow-item-tree/flow-item/flow-item-connection/flow-item-connection.component';
import { FlowItemComponent } from './flow-item-tree/flow-item/flow-item.component';
import { FlowItemContentComponent } from './flow-item-tree/flow-item/flow-item-content/flow-item-content.component';
import { FlowItemTreeComponent } from './flow-item-tree/flow-item-tree.component';
import { CanvasUtilsComponent } from './canvas-utils/canvas-utils.component';
import { CanvasPannerDirective } from './canvas-utils/panning/panner.directive';
import { DeleteStepDialogComponent } from './flow-item-tree/flow-item/flow-item-content/delete-step-dialog/delete-step-dialog.component';
import { IncompleteStepsWidgetComponent } from './incomplete-steps-widget/incomplete-steps-widget.component';
import { DragAndDropModule } from 'angular-draggable-droppable';
import { DropZoneComponent } from './flow-item-tree/flow-item/flow-item-connection/drop-zone/drop-zone.component';
@NgModule({
  imports: [CommonModule, UiCommonModule, DragAndDropModule],
  declarations: [
    BranchLineConnectionComponent,
    LoopLineConnectionComponent,
    SimpleLineConnectionComponent,
    FlowItemConnectionComponent,
    FlowItemComponent,
    FlowItemContentComponent,
    FlowItemTreeComponent,
    CanvasUtilsComponent,
    DeleteStepDialogComponent,
    CanvasPannerDirective,
    IncompleteStepsWidgetComponent,
    DropZoneComponent,
  ],
  exports: [FlowItemTreeComponent, CanvasUtilsComponent, CanvasPannerDirective],
})
export class UiFeatureBuilderCanvasModule {}
