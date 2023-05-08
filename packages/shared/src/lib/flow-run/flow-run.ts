import { BaseModel } from '../common/base-model';
import { ProjectId } from '../project/project';
import { FlowVersionId } from '../flows/flow-version';
import { FileId } from '../file/file';
import { ApId } from '../common/id-generator';
import {
  ExecutionOutput,
  ExecutionOutputStatus,
} from './execution/execution-output';
import { FlowId } from '../flows/flow';
import { ExecutionState } from './execution/execution-state';

export type FlowRunId = ApId;

export enum FlowRunPauseType {
  DELAY = 'DELAY',
}

type BaseFlowRunPauseMetadata<T extends FlowRunPauseType> = {
  type: T;
  step: string;
  executionState: ExecutionState;
}

export type DelayFlowRunPauseMetadata = BaseFlowRunPauseMetadata<FlowRunPauseType.DELAY> & {
  resumeDataTime: string;
}

export type FlowRunPauseMetadata = DelayFlowRunPauseMetadata

export type FlowRun = BaseModel<FlowRunId> & {
  id: FlowRunId;
  projectId: ProjectId;
  flowId: FlowId;
  flowVersionId: FlowVersionId;
  flowDisplayName: string;
  logsFileId: FileId | null;
  status: ExecutionOutputStatus;
  startTime: string;
  finishTime: string;
  environment: RunEnvironment;
  pauseMetadata: FlowRunPauseMetadata;

  // Frontend loads the state
  executionOutput?: ExecutionOutput;
}

export enum RunEnvironment {
  PRODUCTION = 'PRODUCTION',
  TESTING = 'TESTING',
}
