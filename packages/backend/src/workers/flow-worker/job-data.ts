import { CollectionVersionId, FlowRunId, FlowVersionId, InstanceId } from "shared";

interface BaseJobData {
  instanceId: InstanceId | null;
  flowVersionId: FlowVersionId;
  collectionVersionId: CollectionVersionId;
}

export type RepeatableJobData = BaseJobData;

export interface OneTimeJobData extends BaseJobData {
  runId: FlowRunId;
  payload: unknown;
}

export type JobData = RepeatableJobData | OneTimeJobData;
