import {
  FlowRun,
  FlowVersion,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { LeftSideBarType } from './enums/left-side-bar-type.enum';
import { RightSideBarType } from './enums/right-side-bar-type.enum';
import { FlowItem } from './flow-item';
export const NO_PROPS = 'NO_PROPS';
export interface CanvasState {
  leftSidebar: {
    type: LeftSideBarType;
  };
  rightSidebar: {
    type: RightSideBarType;
    props:
      | {
          stepLocationRelativeToParent: StepLocationRelativeToParent;
          stepName: string;
        }
      | typeof NO_PROPS;
  };
  focusedStep: FlowItem | undefined;
  selectedRun: FlowRun | undefined;
  selectedStepName: string;
  displayedFlowVersion: FlowVersion;
  clickedAddBtnId?: number;
}

export interface StepTypeSideBarProps {
  stepName: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent;
}
