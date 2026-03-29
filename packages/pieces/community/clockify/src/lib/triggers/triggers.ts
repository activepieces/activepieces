import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { clockifyAuth, workspaceId, projectId } from '../auth';

const CLOCKIFY_API_BASE = 'https://api.clockify.me/api/v1';

async function getTimeEntries(context: any) {
  const { workspace_id, user_id } = context.propsValue;
  const lastCheck = await context.store?.get(`clockify_time_${workspace_id}_last_check`) ?? Date.now() - 86400000;

  const start = new Date(lastCheck).toISOString();
  const end = new Date().toISOString();

  const url = `${CLOCKIFY_API_BASE}/workspaces/${workspace_id}/user/${user_id || 'me'}/time-entries?start=${start}&end=${end}`;

  const response = await httpClient.sendRequest({
    method: 'GET',
    url,
    headers: { 'X-Api-Key': context.auth.secret_text as string },
  });

  await context.store?.put(`clockify_time_${workspace_id}_last_check`, Date.now());
  return response.body || [];
}

async function getNewTasks(context: any) {
  const { workspace_id, project_id } = context.propsValue;
  const lastCheck = await context.store?.get(`clockify_task_${project_id}_last_check`) ?? Date.now() - 86400000;

  const response = await httpClient.sendRequest({
    method: 'GET',
    url: `${CLOCKIFY_API_BASE}/workspaces/${workspace_id}/projects/${project_id}/tasks`,
    headers: { 'X-Api-Key': context.auth.secret_text as string },
  });

  const tasks = response.body || [];
  const newTasks = tasks.filter((t: any) => {
    const taskTime = t.auditMetadata?.createdAt ?? Date.now();
    return taskTime > lastCheck;
  });

  await context.store?.put(`clockify_task_${project_id}_last_check`, Date.now());
  return newTasks;
}

async function getRunningTimers(context: any) {
  const { workspace_id, user_id } = context.propsValue;
  const knownTimerIds = await context.store?.get(`clockify_timer_${workspace_id}_timers`) ?? [];

  const url = `${CLOCKIFY_API_BASE}/workspaces/${workspace_id}/user/${user_id || 'me'}/time-entries?in-progress=true`;

  const response = await httpClient.sendRequest({
    method: 'GET',
    url,
    headers: { 'X-Api-Key': context.auth.secret_text as string },
  });

  const timers = response.body || [];
  const newTimers = timers.filter((t: any) => !knownTimerIds.includes(t.id));

  await context.store?.put(`clockify_timer_${workspace_id}_timers`, timers.map((t: any) => t.id));
  return newTimers;
}

export const newTimeEntryTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_time_entry',
  displayName: 'New Time Entry',
  description: 'Triggers when a new time entry is created',
  type: TriggerStrategy.POLLING,
  props: {
    workspace_id: workspaceId,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'Leave empty to use current user',
      required: false,
    }),
  },
  sampleData: {
    id: '624d94fb8b3c8c4e9a123456',
    description: 'Time entry description',
    start: '2026-03-29T12:00:00Z',
    end: '2026-03-29T13:00:00Z',
    billable: true,
  },

  async test(context) {
    return await getTimeEntries(context);
  },

  async onEnable(context) {
    await getTimeEntries(context);
  },

  async onDisable(context) {
    const { workspace_id } = context.propsValue;
    await context.store?.delete(`clockify_time_${workspace_id}_last_check`);
  },

  async run(context) {
    return await getTimeEntries(context);
  },
});

export const newTaskTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created',
  type: TriggerStrategy.POLLING,
  props: {
    workspace_id: workspaceId,
    project_id: projectId,
  },
  sampleData: {
    id: '624d94fb8b3c8c4e9a123456',
    name: 'Task name',
    status: 'ACTIVE',
  },

  async test(context) {
    return await getNewTasks(context);
  },

  async onEnable(context) {
    await getNewTasks(context);
  },

  async onDisable(context) {
    const { project_id } = context.propsValue;
    await context.store?.delete(`clockify_task_${project_id}_last_check`);
  },

  async run(context) {
    return await getNewTasks(context);
  },
});

export const newTimerStartedTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_timer_started',
  displayName: 'New Timer Started',
  description: 'Triggers when a new timer is started',
  type: TriggerStrategy.POLLING,
  props: {
    workspace_id: workspaceId,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'Leave empty to use current user',
      required: false,
    }),
  },
  sampleData: {
    id: '624d94fb8b3c8c4e9a123456',
    description: 'Timer description',
    start: '2026-03-29T12:00:00Z',
  },

  async test(context) {
    return await getRunningTimers(context);
  },

  async onEnable(context) {
    await getRunningTimers(context);
  },

  async onDisable(context) {
    const { workspace_id } = context.propsValue;
    await context.store?.delete(`clockify_timer_${workspace_id}_timers`);
  },

  async run(context) {
    return await getRunningTimers(context);
  },
});
