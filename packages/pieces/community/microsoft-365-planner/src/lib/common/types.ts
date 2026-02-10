import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  Group,
  PlannerBucket,
  PlannerPlan,
  PlannerPlanContainer,
  PlannerTask,
  User
} from '@microsoft/microsoft-graph-types';

export interface AuthenticationParams {
  auth: OAuth2PropertyValue;
}

export interface GenericDetailParams extends AuthenticationParams {
  id: string;
}

// API Types
export interface ListPlansResponse {
  value: PlannerPlan[];
}

export interface ListGroupsResponse {
  value: Group[];
}

export interface ListBucketsParams extends AuthenticationParams {
  planId: string;
}

export interface ListBucketsResponse {
  value: PlannerBucket[];
}

export interface ListTasksParams extends AuthenticationParams {
  planId: string;
}

export interface ListTasksResponse {
  value: PlannerTask[];
}

export interface CreatePlanParams extends AuthenticationParams {
  title: string;
  container: PlannerPlanContainer;
}

export type CreatePlanResponse = PlannerPlan;

export interface CreateBucketParams
  extends AuthenticationParams,
    Omit<PlannerBucket, 'id'> {}

export type CreateBucketResponse = PlannerBucket;

export interface CreateTaskParams
  extends AuthenticationParams,
    Omit<PlannerTask, 'id'> {}

export type CreateTaskResponse = PlannerTask;

export type DeleteBucketParams = GenericDetailParams;

export type DeleteTaskParams = GenericDetailParams;

export interface UpdatePlanParams extends AuthenticationParams {
  id: string;
  title: string;
}

export interface UpdateBucketParams extends AuthenticationParams {
  id: string;
  name?: string;
  orderHint?: string;
}

export interface UpdateTaskParams
  extends AuthenticationParams,
    Omit<
      PlannerTask,
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
    > {
  id: string;
}

export interface GetBucketDetailsParams extends AuthenticationParams {
  bucketId: string;
}

export type GetUserResponse = User;

export interface ListUserResponse {
  value: User[];
}
