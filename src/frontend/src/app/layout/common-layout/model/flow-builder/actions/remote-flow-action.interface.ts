import { FlowItem } from '../flow-item';

export interface RemoteFlowAction extends FlowItem {
	settings: {
		pieceVersionId: string;
		flowVersionId: string;
		//input is a map between configs and their values
		input: { [key: string]: any };
	};
}
