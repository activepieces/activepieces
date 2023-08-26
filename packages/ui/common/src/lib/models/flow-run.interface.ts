import {
  ExecutionOutputStatus,
  FlowRun,
  RunEnvironment,
} from '@activepieces/shared';

export const initializedRun: FlowRun = {
  id: '',
  projectId: '',
  flowVersionId: '',
  flowId: '',
  tags: [],
  status: ExecutionOutputStatus.RUNNING,
  logsFileId: '',
  startTime: '',
  finishTime: '',
  created: '',
  updated: '',
  environment: RunEnvironment.TESTING,
  flowDisplayName: '',
};
