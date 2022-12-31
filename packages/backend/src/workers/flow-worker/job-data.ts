import { CollectionVersionId, FlowRunId, FlowVersionId, InstanceId } from "shared";

export interface JobData {
  runId: FlowRunId;
  instanceId: InstanceId | null;
  flowVersionId: FlowVersionId;
  collectionVersionId: CollectionVersionId;
  payload: unknown;
}
