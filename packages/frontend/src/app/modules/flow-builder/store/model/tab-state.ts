import { FlowRun } from '@activepieces/shared';
import { LeftSideBarType } from '../../../common/model/enum/left-side-bar-type.enum';
import { RightSideBarType } from '../../../common/model/enum/right-side-bar-type.enum';
import { FlowItem } from '../../../common/model/flow-builder/flow-item';

export interface TabState {
  leftSidebar: {
    type: LeftSideBarType;
  };
  rightSidebar: {
    type: RightSideBarType;
    props: any;
  };
  focusedStep: FlowItem | null;
  selectedRun: FlowRun | undefined;
  selectedStepName: string;
}
