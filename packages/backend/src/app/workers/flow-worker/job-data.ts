import { CollectionId, CollectionVersionId, FlowRunId, FlowVersion, FlowVersionId, ProjectId, RunEnvironment, TriggerType } from "@activepieces/shared";

interface BaseJobData {
  environment: RunEnvironment;
  collectionVersionId: CollectionVersionId;
}

export interface RepeatableJobData extends BaseJobData {
  collectionId: CollectionId;
  flowVersion: FlowVersion;
  triggerType: TriggerType;
  projectId: ProjectId;
};

export interface OneTimeJobData extends BaseJobData {
  flowVersionId: FlowVersionId;
  projectId: ProjectId;
  runId: FlowRunId;
  payload: unknown;
}

export type JobData = RepeatableJobData | OneTimeJobData;
