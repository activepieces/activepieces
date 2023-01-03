import { CollectionVersionId, FlowRunId, FlowVersionId, RunEnvironment } from "shared";

interface BaseJobData {
  environment: RunEnvironment;
  flowVersionId: FlowVersionId;
  collectionVersionId: CollectionVersionId;
}

export type RepeatableJobData = BaseJobData;

export interface OneTimeJobData extends BaseJobData {
  runId: FlowRunId;
  payload: unknown;
}

export type JobData = RepeatableJobData | OneTimeJobData;
