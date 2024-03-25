import { ViewModeEnum } from './enums/view-mode.enum';
import { FlowState } from './flow-state';
import { CanvasState } from './canvas-state';

export class GlobalBuilderState {
  readonly flowState: FlowState;
  readonly viewMode: ViewModeEnum;
  readonly canvasState: CanvasState;
}
