import { isNil } from '@activepieces/pieces-framework';
import { TogglTwoAuthValue, togglApi } from './client';
import { NormalizedTimeEntry, togglModels, TwoTimeEntry } from './models';

async function twoStart({
  auth,
  workspaceId,
  start,
  description,
  projectId,
  taskId,
  tags,
  billable,
}: {
  auth: TogglTwoAuthValue;
  workspaceId: number;
  start: string;
  description: string | undefined;
  projectId: number | undefined;
  taskId: number | undefined;
  tags: string[] | undefined;
  billable: boolean | undefined;
}): Promise<NormalizedTimeEntry> {
  const tagIds = await togglApi.resolveTwoTagIds({
    auth,
    workspaceId,
    names: tags,
  });
  const started = await togglApi.request<TwoTimeEntry>({
    auth,
    method: togglApi.HttpMethod.POST,
    path: togglApi.twoWorkspacePath({
      auth,
      workspaceId,
      path: '/tracking/start',
    }),
    body: {
      type: 'activity',
      start,
      ...(description ? { description } : {}),
      ...(isNil(projectId) ? {} : { project_id: projectId }),
      ...(isNil(taskId) ? {} : { task_id: taskId }),
      ...(isNil(tagIds) ? {} : { tag_ids: tagIds }),
      ...(isNil(billable) ? {} : { billable }),
    },
  });
  return togglModels.timeEntry({ item: started, running: true });
}

async function twoCurrent({
  auth,
  workspaceId,
}: {
  auth: TogglTwoAuthValue;
  workspaceId: number;
}): Promise<NormalizedTimeEntry | null> {
  const body = await togglApi.request<unknown>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: togglApi.twoWorkspacePath({
      auth,
      workspaceId,
      path: '/tracking/current',
    }),
  });
  if (!togglModels.isTimeEntry(body)) {
    return null;
  }
  return togglModels.timeEntry({ item: body, running: true });
}

async function twoStop({
  auth,
  workspaceId,
}: {
  auth: TogglTwoAuthValue;
  workspaceId: number;
}): Promise<NormalizedTimeEntry> {
  const stopped = await togglApi.request<TwoTimeEntry>({
    auth,
    method: togglApi.HttpMethod.POST,
    path: togglApi.twoWorkspacePath({
      auth,
      workspaceId,
      path: '/tracking/stop',
    }),
    body: { end: new Date().toISOString() },
  });
  return togglModels.timeEntry({ item: stopped, running: false });
}

export const togglTimeEntries = {
  twoStart,
  twoCurrent,
  twoStop,
};
