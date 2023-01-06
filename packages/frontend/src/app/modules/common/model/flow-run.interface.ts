import { ExecutionOutputStatus, FlowRun, RunEnvironment } from 'shared';

export const initializedRun: FlowRun = {
	id: '',
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
	environment: RunEnvironment.TESTING,
	collectionDisplayName: '',
	flowDisplayName: '',
};
