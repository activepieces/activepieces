import {
  FlowRun,
  FlowVersion,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { LeftSideBarType } from './enums/left-side-bar-type.enum';
import { RightSideBarType } from './enums/right-side-bar-type.enum';
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
  runInfo: {
    selectedRun: FlowRun | undefined;
    loopIndexes: Record<string, number>;
  };
  selectedStepName: string;
  viewedVersion: FlowVersion;
  clickedAddBtnId?: number;
}

export interface StepTypeSideBarProps {
  stepName: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent;
}
