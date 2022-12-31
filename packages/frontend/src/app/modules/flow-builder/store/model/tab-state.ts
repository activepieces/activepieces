import { FlowRun } from 'shared';
import { FlowItem } from 'src/app/modules/common/model/flow-builder/flow-item';
import { LeftSideBarType } from '../../../common/model/enum/left-side-bar-type.enum';
import { RightSideBarType } from '../../../common/model/enum/right-side-bar-type.enum';

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
