import { FlowItem } from '../flow-item';

export interface CodeAction extends FlowItem {
	settings: {
		input: any;
		artifactUrl: string;
		// // Artifact file to upload if exists
		// artifactContent?: Artifact;
	};
}
