import { FlowRun, StepLocationRelativeToParent } from '@activepieces/shared';
import { LeftSideBarType } from '../../../common/model/enum/left-side-bar-type.enum';
import { RightSideBarType } from '../../../common/model/enum/right-side-bar-type.enum';
import { FlowItem } from '../../../common/model/flow-builder/flow-item';

export interface TabState {
  leftSidebar: {
    type: LeftSideBarType;
  };
  rightSidebar: {
    type: RightSideBarType;
    props: StepTypeSideBarProps | {};
  };

  focusedStep: FlowItem | null;
  selectedRun: FlowRun | undefined;
  selectedStepName: string;
}

export interface StepTypeSideBarProps {
  stepName: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent;
}
