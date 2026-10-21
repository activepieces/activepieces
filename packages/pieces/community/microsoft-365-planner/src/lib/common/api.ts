import { microsoft365PlannerClient } from './client';

import type {
  Group,
  Microsoft365PlannerAuthValue,
  Microsoft365PlannerCreateBucketParams,
  Microsoft365PlannerCreateTaskParams,
  Microsoft365PlannerEtagged,
  Microsoft365PlannerDirectoryObject,
  Microsoft365PlannerList,
  Microsoft365PlannerPage,
  Microsoft365PlannerUpdateTaskParams,
  PlannerBucket,
  PlannerPlan,
  PlannerPlanDetails,
  PlannerTask,
  PlannerTaskDetails,
  User,
} from './types';
import type { Client } from '@microsoft/microsoft-graph-client';

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

async function updateWithEtag<T>({
  auth,
  path,
  body,
}: {
  auth: Microsoft365PlannerAuthValue;
  path: string;
  body: Record<string, unknown>;
}): Promise<T> {
  const client = microsoft365PlannerClient.create({ auth });
  const etag = await getEtag({ auth, path });
  const response: T = await client
    .api(path)
    .header('If-Match', etag)
    .header('Prefer', 'return=representation')
    .update(body);
  return response;
}

async function deleteWithEtag({
  auth,
  path,
}: {
  auth: Microsoft365PlannerAuthValue;
  path: string;
}): Promise<void> {
  const client = microsoft365PlannerClient.create({ auth });
  const etag = await getEtag({ auth, path });
  await client.api(path).header('If-Match', etag).delete();
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

async function listUnifiedGroups({
  auth,
  limit,
  cursor,
}: {
  auth: Microsoft365PlannerAuthValue;
  limit: number;
  cursor?: string;
}): Promise<Microsoft365PlannerPage<Group>> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: Microsoft365PlannerList<Group> = await client
    .api('/groups')
    .filter("groupTypes/any(c:c eq 'Unified')")
    .select('id,displayName,description,mail,visibility,createdDateTime')
    .top(limit)
    .query(cursor ? { $skiptoken: cursor } : {})
    .get();
  return {
    items: response.value,
    nextCursor: skipToken({ nextLink: response['@odata.nextLink'] }),
  };
}

async function listGroupMembers({
  auth,
  groupId,
  limit,
  cursor,
}: {
  auth: Microsoft365PlannerAuthValue;
  groupId: string;
  limit: number;
  cursor?: string;
}): Promise<Microsoft365PlannerPage<Microsoft365PlannerDirectoryObject>> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: Microsoft365PlannerList<Microsoft365PlannerDirectoryObject> =
    await client
      .api(`/groups/${groupId}/members`)
      .select('id,displayName,mail,userPrincipalName')
      .top(limit)
      .query(cursor ? { $skiptoken: cursor } : {})
      .get();
  return {
    items: response.value,
    nextCursor: skipToken({ nextLink: response['@odata.nextLink'] }),
  };
}

function skipToken({
  nextLink,
}: {
  nextLink: string | undefined;
}): string | null {
  if (!nextLink) {
    return null;
  }
  return new URL(nextLink).searchParams.get('$skiptoken');
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

async function listUserPage({
  auth,
  limit,
  cursor,
  startsWith,
}: {
  auth: Microsoft365PlannerAuthValue;
  limit: number;
  cursor?: string;
  startsWith?: string;
}): Promise<Microsoft365PlannerPage<User>> {
  const client = microsoft365PlannerClient.create({ auth });
  const prefix = startsWith?.replace(/'/g, "''");
  const request = client
    .api('/users')
    .select('id,displayName,mail,userPrincipalName')
    .top(limit)
    .query(cursor ? { $skiptoken: cursor } : {});
  const response: Microsoft365PlannerList<User> = await (prefix
    ? request.filter(
        `startswith(displayName,'${prefix}') or startswith(mail,'${prefix}') or startswith(userPrincipalName,'${prefix}')`
      )
    : request
  ).get();
  return {
    items: response.value,
    nextCursor: skipToken({ nextLink: response['@odata.nextLink'] }),
  };
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

async function listAllPlans({
  auth,
}: {
  auth: Microsoft365PlannerAuthValue;
}): Promise<PlannerPlan[]> {
  return await listAllPages<PlannerPlan>({ auth, path: '/me/planner/plans' });
}

async function listAllBuckets({
  auth,
  planId,
}: {
  auth: Microsoft365PlannerAuthValue;
  planId: string;
}): Promise<PlannerBucket[]> {
  return await listAllPages<PlannerBucket>({
    auth,
    path: `/planner/plans/${planId}/buckets`,
  });
}

async function listAllTasks({
  auth,
  planId,
}: {
  auth: Microsoft365PlannerAuthValue;
  planId: string;
}): Promise<PlannerTask[]> {
  return await listAllPages<PlannerTask>({
    auth,
    path: `/planner/plans/${planId}/tasks`,
  });
}

async function listGroupPlans({
  auth,
  groupId,
}: {
  auth: Microsoft365PlannerAuthValue;
  groupId: string;
}): Promise<PlannerPlan[]> {
  return await listAllPages<PlannerPlan>({
    auth,
    path: `/groups/${groupId}/planner/plans`,
  });
}

async function getPlan({
  auth,
  planId,
}: {
  auth: Microsoft365PlannerAuthValue;
  planId: string;
}): Promise<PlannerPlan> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: PlannerPlan = await client
    .api(`/planner/plans/${planId}`)
    .get();
  return response;
}

async function patchPlan({
  auth,
  planId,
  title,
}: {
  auth: Microsoft365PlannerAuthValue;
  planId: string;
  title: string;
}): Promise<PlannerPlan> {
  return await updateWithEtag<PlannerPlan>({
    auth,
    path: `/planner/plans/${planId}`,
    body: { title },
  });
}

async function deletePlan({
  auth,
  planId,
}: {
  auth: Microsoft365PlannerAuthValue;
  planId: string;
}): Promise<void> {
  await deleteWithEtag({ auth, path: `/planner/plans/${planId}` });
}

async function getPlanDetails({
  auth,
  planId,
}: {
  auth: Microsoft365PlannerAuthValue;
  planId: string;
}): Promise<PlannerPlanDetails> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: PlannerPlanDetails = await client
    .api(`/planner/plans/${planId}/details`)
    .get();
  return response;
}

async function patchPlanDetails({
  auth,
  planId,
  categoryDescriptions,
}: {
  auth: Microsoft365PlannerAuthValue;
  planId: string;
  categoryDescriptions: Record<string, unknown>;
}): Promise<PlannerPlanDetails> {
  return await updateWithEtag<PlannerPlanDetails>({
    auth,
    path: `/planner/plans/${planId}/details`,
    body: { categoryDescriptions },
  });
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

async function patchBucket({
  auth,
  bucketId,
  fields,
}: {
  auth: Microsoft365PlannerAuthValue;
  bucketId: string;
  fields: Record<string, unknown>;
}): Promise<PlannerBucket> {
  return await updateWithEtag<PlannerBucket>({
    auth,
    path: `/planner/buckets/${bucketId}`,
    body: fields,
  });
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

async function listBucketTasks({
  auth,
  bucketId,
}: {
  auth: Microsoft365PlannerAuthValue;
  bucketId: string;
}): Promise<PlannerTask[]> {
  return await listAllPages<PlannerTask>({
    auth,
    path: `/planner/buckets/${bucketId}/tasks`,
  });
}

async function listMyTasks({
  auth,
}: {
  auth: Microsoft365PlannerAuthValue;
}): Promise<PlannerTask[]> {
  return await listAllPages<PlannerTask>({ auth, path: '/me/planner/tasks' });
}

async function getTask({
  auth,
  taskId,
}: {
  auth: Microsoft365PlannerAuthValue;
  taskId: string;
}): Promise<PlannerTask> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: PlannerTask = await client
    .api(`/planner/tasks/${taskId}`)
    .get();
  return response;
}

async function patchTask({
  auth,
  taskId,
  fields,
}: {
  auth: Microsoft365PlannerAuthValue;
  taskId: string;
  fields: Record<string, unknown>;
}): Promise<PlannerTask> {
  return await updateWithEtag<PlannerTask>({
    auth,
    path: `/planner/tasks/${taskId}`,
    body: fields,
  });
}

async function getTaskDetails({
  auth,
  taskId,
}: {
  auth: Microsoft365PlannerAuthValue;
  taskId: string;
}): Promise<PlannerTaskDetails> {
  const client = microsoft365PlannerClient.create({ auth });
  const response: PlannerTaskDetails = await client
    .api(`/planner/tasks/${taskId}/details`)
    .get();
  return response;
}

async function patchTaskDetails({
  auth,
  taskId,
  fields,
}: {
  auth: Microsoft365PlannerAuthValue;
  taskId: string;
  fields: Record<string, unknown>;
}): Promise<PlannerTaskDetails> {
  return await updateWithEtag<PlannerTaskDetails>({
    auth,
    path: `/planner/tasks/${taskId}/details`,
    body: fields,
  });
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
  listUserPage,
  listGroups,
  listUnifiedGroups,
  listGroupMembers,
  listPlans,
  listAllPlans,
  listGroupPlans,
  getPlan,
  createPlan,
  updatePlan,
  patchPlan,
  deletePlan,
  getPlanDetails,
  patchPlanDetails,
  listBuckets,
  listAllBuckets,
  getBucket,
  createBucket,
  updateBucket,
  patchBucket,
  deleteBucket,
  listTasks,
  listAllTasks,
  listBucketTasks,
  listMyTasks,
  getTask,
  createTask,
  updateTask,
  patchTask,
  getTaskDetails,
  patchTaskDetails,
  deleteTask,
};

async function listAllPages<T>({
  auth,
  path,
}: {
  auth: Microsoft365PlannerAuthValue;
  path: string;
}): Promise<T[]> {
  const client = microsoft365PlannerClient.create({ auth });
  return await collectPages<T>({ client, url: path });
}

async function collectPages<T>({
  client,
  url,
}: {
  client: Client;
  url: string;
}): Promise<T[]> {
  const response: Microsoft365PlannerList<T> = await client.api(url).get();
  const nextLink = response['@odata.nextLink'];
  return nextLink
    ? [...response.value, ...(await collectPages<T>({ client, url: nextLink }))]
    : response.value;
}
