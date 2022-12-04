import { FlowItem } from '../flow-item';

export interface LoopOnItemActionInterface extends FlowItem {
	firstLoopAction?: FlowItem;
	settings: {
		items: any[];
	};
}
