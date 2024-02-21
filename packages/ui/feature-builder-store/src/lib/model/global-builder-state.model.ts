import { ViewModeEnum } from './enums/view-mode.enum';
import { FlowItemsDetailsState } from './flow-items-details-state.model';
import { FlowState } from './flow-state';
import { CanvasState } from './canvas-state';

export class GlobalBuilderState {
  readonly flowState: FlowState;
  readonly viewMode: ViewModeEnum;
  readonly flowItemsDetailsState: FlowItemsDetailsState;
  readonly canvasState: CanvasState;
}
