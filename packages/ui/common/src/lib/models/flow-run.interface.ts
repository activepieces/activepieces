import { FlowRunStatus, FlowRun, RunEnvironment } from '@activepieces/shared';

export const initializedRun: FlowRun = {
  id: '',
  projectId: '',
  flowVersionId: '',
  flowId: '',
  tags: [],
  steps: {},
  status: FlowRunStatus.RUNNING,
  logsFileId: '',
  startTime: '',
  finishTime: '',
  created: '',
  updated: '',
  environment: RunEnvironment.TESTING,
  flowDisplayName: '',
};
