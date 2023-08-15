import { BaseModel } from '../common/base-model';
import { ProjectId } from '../project/project';
import { FlowVersionId } from '../flows/flow-version';
import { FileId } from '../file/file';
import { ApId } from '../common/id-generator';
import {
  ExecutionOutput,
  ExecutionOutputStatus,
  PauseMetadata,
} from './execution/execution-output';
import { FlowId } from '../flows/flow';

export type FlowRunId = ApId;

export type FlowRun = BaseModel<FlowRunId> & {
  id: FlowRunId;
  projectId: ProjectId;
  flowId: FlowId;
  tags?: string[];
  flowVersionId: FlowVersionId;
  flowDisplayName: string;
  logsFileId: FileId | null;
  tasks?: number;
  status: ExecutionOutputStatus;
  startTime: string;
  finishTime: string;
  environment: RunEnvironment;
  pauseMetadata?: PauseMetadata | null;
  executionOutput?: ExecutionOutput;
}

export enum RunEnvironment {
  PRODUCTION = 'PRODUCTION',
  TESTING = 'TESTING',
}
