import { BaseModel } from '../common/base-model';
import { ProjectId } from '../project/project';
import { FlowVersionId } from '../flows/flow-version';
import { FileId } from '../file/file';
import { CollectionId } from '../collections/collection';
import { ApId } from '../common/id-generator';
import {
  ExecutionOutput,
  ExecutionOutputStatus,
} from './execution/execution-output';
import { FlowId } from '../flows/flow';

export type FlowRunId = ApId;

export interface FlowRun extends BaseModel<FlowRunId> {
  id: FlowRunId;
  projectId: ProjectId;
  flowId: FlowId;
  collectionId: CollectionId;
  flowVersionId: FlowVersionId;
  flowDisplayName: string;
  collectionDisplayName: string;
  logsFileId: FileId | null;
  status: ExecutionOutputStatus;
  startTime: string;
  finishTime: string;
  environment: RunEnvironment;

  // Frontend loads the state
  executionOutput?: ExecutionOutput;
}

export enum RunEnvironment {
  PRODUCTION = 'PRODUCTION',
  TESTING = 'TESTING',
}
