import { CollectionId, FlowRunId, FlowVersion, FlowVersionId, ProjectId, RunEnvironment, TriggerType } from "@activepieces/shared";

interface BaseJobData {
  environment: RunEnvironment;
  collectionId: CollectionId;
  projectId: ProjectId;

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
