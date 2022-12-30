import { FlowItem } from '../flow-item';

export interface CodeAction extends FlowItem {
	settings: {
		input: any;
		artifact_source_id: string;
	};
}
