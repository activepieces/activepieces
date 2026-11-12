import type { AppConnectionType } from '@activepieces/pieces-framework';
import type {
  PlannerBucket,
  PlannerTask,
  User,
} from '@microsoft/microsoft-graph-types';

export type {
  Group,
  PlannerBucket,
  PlannerPlan,
  PlannerPlanDetails,
  PlannerTask,
  PlannerTaskDetails,
  User,
} from '@microsoft/microsoft-graph-types';

export type Microsoft365PlannerAuthValue = {
  type:
    | AppConnectionType.OAUTH2
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2;
  access_token: string;
  props?: { cloud?: string | null };
};

export type Microsoft365PlannerList<T> = {
  value: T[];
  '@odata.nextLink'?: string;
};

export type Microsoft365PlannerPage<T> = { items: T[]; nextCursor: string | null };

export type Microsoft365PlannerDirectoryObject = User & { '@odata.type'?: string };

export type Microsoft365PlannerEtagged = { '@odata.etag': string };

export type Microsoft365PlannerCreateBucketParams = Omit<PlannerBucket, 'id'>;

export type Microsoft365PlannerCreateTaskParams = Omit<PlannerTask, 'id'>;

export type Microsoft365PlannerUpdateTaskParams = Omit<
  PlannerTask,
  | 'id'
  | 'activeChecklistItemCount'
  | 'checklistItemCount'
  | 'completedBy'
  | 'completedDateTime'
  | 'createdBy'
  | 'createdDateTime'
  | 'hasDescription'
  | 'planId'
  | 'previewType'
  | 'referenceCount'
  | 'assignedToTaskBoardFormat'
  | 'bucketTaskBoardFormat'
  | 'details'
  | 'progressTaskBoardFormat'
>;
