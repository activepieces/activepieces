import { microsoft365PlannerClient } from './client';

import type {
  Group,
  Microsoft365PlannerAuthValue,
  Microsoft365PlannerCreateBucketParams,
  Microsoft365PlannerCreateTaskParams,
  Microsoft365PlannerEtagged,
  Microsoft365PlannerList,
  Microsoft365PlannerUpdateTaskParams,
  PlannerBucket,
  PlannerPlan,
  PlannerTask,
  User,
} from './types';

async function getEtag({
  auth,
  path,
}: {
  auth: Microsoft365PlannerAuthValue;
  path: string;
}): Promise<string> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: Microsoft365PlannerEtagged = await client.api(path).get();
  return response['@odata.etag'];
}

async function getUser({
  auth,
}: {
  auth: Microsoft365PlannerAuthValue;
}): Promise<User> {
  const client = microsoft365PlannerClient.create({ auth });
  const user: User = await client.api('/me').get();
  return user;
}

async function listUsers({
  auth,
}: {
  auth: Microsoft365PlannerAuthValue;
}): Promise<User[]> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: Microsoft365PlannerList<User> = await client
    .api('/users')
    .get();
  return response.value;
}

async function listGroups({
  auth,
}: {
  auth: Microsoft365PlannerAuthValue;
}): Promise<Group[]> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: Microsoft365PlannerList<Group> = await client
    .api('/groups')
    .get();
  return response.value;
}

async function listPlans({
  auth,
}: {
  auth: Microsoft365PlannerAuthValue;
}): Promise<PlannerPlan[]> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: Microsoft365PlannerList<PlannerPlan> = await client
    .api('/me/planner/plans')
    .get();
  return response.value;
}

async function createPlan({
  auth,
  groupId,
  title,
}: {
  auth: Microsoft365PlannerAuthValue;
  groupId: string;
  title: string;
}): Promise<PlannerPlan> {
  const client = microsoft365PlannerClient.create({ auth });
  const graphBaseUrl = microsoft365PlannerClient.baseUrl({ auth });
  const response: PlannerPlan = await client.api('/planner/plans').create({
    container: {
      url: `${graphBaseUrl}/v1.0/groups/${groupId}`,
    },
    title,
  });
  return response;
}

async function updatePlan({
  auth,
  id,
  title,
}: {
  auth: Microsoft365PlannerAuthValue;
  id: string;
  title: string;
}): Promise<{ success: boolean }> {
  const client = microsoft365PlannerClient.create({ auth });
  const etag = await getEtag({ auth, path: `/planner/plans/${id}` });
  await client
    .api(`/planner/plans/${id}`)
    .header('If-Match', etag)
    .update({ title });
  return { success: true };
}

async function listBuckets({
  auth,
  planId,
}: {
  auth: Microsoft365PlannerAuthValue;
  planId: string;
}): Promise<PlannerBucket[]> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: Microsoft365PlannerList<PlannerBucket> = await client
    .api(`/planner/plans/${planId}/buckets`)
    .get();
  return response.value;
}

async function getBucket({
  auth,
  bucketId,
}: {
  auth: Microsoft365PlannerAuthValue;
  bucketId: string;
}): Promise<PlannerBucket> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: PlannerBucket = await client
    .api(`/planner/buckets/${bucketId}`)
    .get();
  return response;
}

async function createBucket({
  auth,
  ...bucketParams
}: Microsoft365PlannerCreateBucketParams & {
  auth: Microsoft365PlannerAuthValue;
}): Promise<PlannerBucket> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: PlannerBucket = await client
    .api('/planner/buckets')
    .create(bucketParams);
  return response;
}

async function updateBucket({
  auth,
  id,
  name,
  orderHint,
}: {
  auth: Microsoft365PlannerAuthValue;
  id: string;
  name?: string;
  orderHint?: string;
}): Promise<{ success: boolean }> {
  const client = microsoft365PlannerClient.create({ auth });
  const etag = await getEtag({ auth, path: `/planner/buckets/${id}` });
  await client
    .api(`/planner/buckets/${id}`)
    .header('If-Match', etag)
    .update({ name, orderHint });
  return { success: true };
}

async function deleteBucket({
  auth,
  id,
}: {
  auth: Microsoft365PlannerAuthValue;
  id: string;
}): Promise<{ success: boolean }> {
  const client = microsoft365PlannerClient.create({ auth });
  const etag = await getEtag({ auth, path: `/planner/buckets/${id}` });
  await client.api(`/planner/buckets/${id}`).header('If-Match', etag).delete();
  return { success: true };
}

async function listTasks({
  auth,
  planId,
}: {
  auth: Microsoft365PlannerAuthValue;
  planId: string;
}): Promise<PlannerTask[]> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: Microsoft365PlannerList<PlannerTask> = await client
    .api(`/planner/plans/${planId}/tasks`)
    .get();
  return response.value;
}

async function createTask({
  auth,
  ...taskParams
}: Microsoft365PlannerCreateTaskParams & {
  auth: Microsoft365PlannerAuthValue;
}): Promise<PlannerTask> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: PlannerTask = await client
    .api('/planner/tasks')
    .create(taskParams);
  return response;
}

async function updateTask({
  auth,
  id,
  ...taskParams
}: Microsoft365PlannerUpdateTaskParams & {
  auth: Microsoft365PlannerAuthValue;
  id: string;
}): Promise<{ success: boolean }> {
  const client = microsoft365PlannerClient.create({ auth });
  const etag = await getEtag({ auth, path: `/planner/tasks/${id}` });
  await client
    .api(`/planner/tasks/${id}`)
    .header('If-Match', etag)
    .update(taskParams);
  return { success: true };
}

async function deleteTask({
  auth,
  id,
}: {
  auth: Microsoft365PlannerAuthValue;
  id: string;
}): Promise<{ success: boolean }> {
  const client = microsoft365PlannerClient.create({ auth });
  const etag = await getEtag({ auth, path: `/planner/tasks/${id}` });
  await client.api(`/planner/tasks/${id}`).header('If-Match', etag).delete();
  return { success: true };
}

export const microsoft365PlannerApi = {
  getUser,
  listUsers,
  listGroups,
  listPlans,
  createPlan,
  updatePlan,
  listBuckets,
  getBucket,
  createBucket,
  updateBucket,
  deleteBucket,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
};
