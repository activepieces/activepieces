import { FlowItem } from 'src/app/layout/common-layout/model/flow-builder/flow-item';
import { LeftSideBarType } from '../../../common-layout/model/enum/left-side-bar-type.enum';
import { RightSideBarType } from '../../../common-layout/model/enum/right-side-bar-type.enum';
import { InstanceRun } from '../../../common-layout/model/instance-run.interface';

export interface TabState {
	leftSidebar: {
		type: LeftSideBarType;
	};
	rightSidebar: {
		type: RightSideBarType;
		props: any;
	};
	focusedStep: FlowItem | null;
	selectedRun: InstanceRun | undefined;
	selectedStepName: string;
}
