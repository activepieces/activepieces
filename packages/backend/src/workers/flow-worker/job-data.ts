import { CollectionVersionId, FlowRunId, FlowVersionId, RunEnvironment, TriggerType } from "shared";

interface BaseJobData {
  environment: RunEnvironment;
  flowVersionId: FlowVersionId;
  collectionVersionId: CollectionVersionId;
}

export interface RepeatableJobData extends BaseJobData {
  triggerType: TriggerType;
};

export interface OneTimeJobData extends BaseJobData {
  runId: FlowRunId;
  payload: unknown;
}

export type JobData = RepeatableJobData | OneTimeJobData;
