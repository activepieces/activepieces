import { CollectionId, CollectionVersionId, FlowRunId, FlowVersion, FlowVersionId, RunEnvironment, TriggerType } from "shared";

interface BaseJobData {
  environment: RunEnvironment;
  collectionVersionId: CollectionVersionId;
}

export interface RepeatableJobData extends BaseJobData {
  collectionId: CollectionId;
  flowVersion: FlowVersion;
  triggerType: TriggerType;
};

export interface OneTimeJobData extends BaseJobData {
  flowVersionId: FlowVersionId;
  runId: FlowRunId;
  payload: unknown;
}

export type JobData = RepeatableJobData | OneTimeJobData;
