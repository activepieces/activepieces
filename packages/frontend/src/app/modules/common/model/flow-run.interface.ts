import { ExecutionOutputStatus, FlowRun } from 'shared';

export const initializedRun: FlowRun = {
	id: '',
	instanceId: '',
	projectId: '',
	collectionId: '',
	flowVersionId: '',
	flowId: '',
	collectionVersionId: '',
	status: ExecutionOutputStatus.RUNNING,
	logsFileId: '',
	startTime: '',
	finishTime: '',
	created: '',
	updated: '',
	collectionDisplayName: '',
	flowDisplayName: ''
};
