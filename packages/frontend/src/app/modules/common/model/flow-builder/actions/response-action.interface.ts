import { FlowItem } from '../flow-item';

export interface ResponseAction extends FlowItem {
	settings: {
		//this is a dictionary
		output: { [key: string]: any };
	};
}
