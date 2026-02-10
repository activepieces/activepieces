import { PieceAuth } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { PlannerBucket } from '@microsoft/microsoft-graph-types';
import {
  AuthenticationParams,
  CreateBucketParams,
  CreateBucketResponse,
  CreatePlanParams,
  CreatePlanResponse,
  CreateTaskParams,
  CreateTaskResponse,
  DeleteBucketParams,
  DeleteTaskParams,
  GetBucketDetailsParams,
  GetUserResponse,
  ListBucketsParams,
  ListBucketsResponse,
  ListGroupsResponse,
  ListPlansResponse,
  ListTasksParams,
  ListTasksResponse,
  ListUserResponse,
  UpdateBucketParams,
  UpdatePlanParams,
  UpdateTaskParams,
} from './types';

export const microsoft365PlannerAuth = PieceAuth.OAuth2({
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: ['Tasks.ReadWrite', 'User.Read', 'Group.Read.All'],
  prompt: 'omit',
});

export const microsoft365PlannerCommon = {
  endpoints: {
    createPlan: '/planner/plans',
    listPlans: '/me/planner/plans',
    listGroups: '/groups',
    planDetail: (id: string) => `/planner/plans/${id}`,
    listBuckets: (planId: string) => `/planner/plans/${planId}/buckets`,
    listPlanTasks: (planId: string) => `/planner/plans/${planId}/tasks`,
    createBucket: '/planner/buckets',
    bucketDetail: (id: string) => `/planner/buckets/${id}`,
    createTask: '/planner/tasks',
    deleteTask: (id: string) => `/planner/tasks/${id}`,
  },
  getClient: ({ auth }: AuthenticationParams) => {
    return Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          return auth.access_token;
        },
      },
    });
  },
  getUser: async ({ auth }: AuthenticationParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const user: GetUserResponse = await client.api('/me').get();
    return user;
  },
  getEtag: async ({
    auth,
    id,
    endpointType,
  }: AuthenticationParams & {
    id: string;
    endpointType:
      | 'planDetail'
      | 'listBuckets'
      | 'listPlanTasks'
      | 'bucketDetail'
      | 'deleteTask'
      | 'deleteTask';
  }) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const endpointFn = microsoft365PlannerCommon.endpoints[endpointType] as (
      arg: string
    ) => string;
    const endpoint = endpointFn(id);
    const response = await client.api(endpoint).get();
    return (response as any)['@odata.etag'] as string;
  },
  listUsers: async ({ auth }: AuthenticationParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const response: ListUserResponse = await client.api('/users').get();
    return response.value;
  },
  listGroups: async ({ auth }: AuthenticationParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const response: ListGroupsResponse = await client
      .api(microsoft365PlannerCommon.endpoints.listGroups)
      .get();
    return response.value;
  },
  listPlans: async ({ auth }: AuthenticationParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const response: ListPlansResponse = await client
      .api(microsoft365PlannerCommon.endpoints.listPlans)
      .get();
    return response.value;
  },
  listBuckets: async ({ auth, planId }: ListBucketsParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const response: ListBucketsResponse = await client
      .api(microsoft365PlannerCommon.endpoints.listBuckets(planId))
      .get();
    return response.value;
  },
  listTasks: async ({ auth, planId }: ListTasksParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });

    const response: ListTasksResponse = await client
      .api(microsoft365PlannerCommon.endpoints.listPlanTasks(planId))
      .get();
    return response.value;
  },
  createPlan: async ({ auth, ...planParams }: CreatePlanParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const response: CreatePlanResponse = await client
      .api(microsoft365PlannerCommon.endpoints.createPlan)
      .create(planParams);
    return response;
  },
  createBucket: async ({ auth, ...bucketParams }: CreateBucketParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const response: CreateBucketResponse = await client
      .api(microsoft365PlannerCommon.endpoints.createBucket)
      .create(bucketParams);
    return response;
  },
  updateBucket: async ({ auth, id, name, orderHint }: UpdateBucketParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const etag = await microsoft365PlannerCommon.getEtag({
      auth,
      id,
      endpointType: 'bucketDetail',
    });
    await client
      .api(microsoft365PlannerCommon.endpoints.bucketDetail(id))
      .header('If-Match', etag)
      .update({ name, orderHint });
    return { success: true };
  },
  deleteTask: async ({ auth, id }: DeleteTaskParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const etag = await microsoft365PlannerCommon.getEtag({
      auth,
      id,
      endpointType: 'deleteTask',
    });
    await client
      .api(microsoft365PlannerCommon.endpoints.deleteTask(id))
      .header('If-Match', etag)
      .delete();
    return { success: true };
  },
  createTask: async ({ auth, ...taskParams }: CreateTaskParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const response: CreateTaskResponse = await client
      .api(microsoft365PlannerCommon.endpoints.createTask)
      .create(taskParams);
    return response;
  },
  updateTask: async ({ auth, id, ...taskParams }: UpdateTaskParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const etag = await microsoft365PlannerCommon.getEtag({
      auth,
      id,
      endpointType: 'deleteTask',
    });
    await client
      .api(microsoft365PlannerCommon.endpoints.deleteTask(id))
      .header('If-Match', etag)
      .update(taskParams);
    return { success: true };
  },
  deleteBucket: async ({ auth, id }: DeleteBucketParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const etag = await microsoft365PlannerCommon.getEtag({
      auth,
      id,
      endpointType: 'bucketDetail',
    });
    await client
      .api(microsoft365PlannerCommon.endpoints.bucketDetail(id))
      .header('If-Match', etag)
      .delete();
    return { success: true };
  },

  updatePlan: async ({ auth, id, title }: UpdatePlanParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const etag = await microsoft365PlannerCommon.getEtag({
      auth,
      id,
      endpointType: 'planDetail',
    });
    await client
      .api(microsoft365PlannerCommon.endpoints.planDetail(id))
      .header('If-Match', etag)
      .update({ title });
    return { success: true };
  },
  getBucketDetails: async ({ auth, bucketId }: GetBucketDetailsParams) => {
    const client = microsoft365PlannerCommon.getClient({ auth });
    const response: PlannerBucket = await client
      .api(microsoft365PlannerCommon.endpoints.bucketDetail(bucketId))
      .get();
    return response;
  },
};
