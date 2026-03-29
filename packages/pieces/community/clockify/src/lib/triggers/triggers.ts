import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { clockifyAuth, workspaceId, projectId } from '../auth';

async function getTimeEntries(context: any) {
  const { workspace_id, user_id } = context.propsValue;
  const lastCheck = await context.store?.get(`${workspace_id}_last_check`) ?? Date.now() - 86400000;

  const start = new Date(lastCheck).toISOString();
  const end = new Date().toISOString();

  const url = `https://api.clockify.me/api/v1/workspaces/${workspace_id}/user/${user_id || 'me'}/time-entries?start=${start}&end=${end}`;

  const response = await httpClient.sendRequest({
    method: 'GET',
    url,
    headers: { 'X-Api-Key': context.auth as string },
  });

  await context.store?.put(`${workspace_id}_last_check`, Date.now());
  return response.body || [];
}

async function getNewTasks(context: any) {
  const { workspace_id, project_id } = context.propsValue;
  const lastCheck = await context.store?.get(`${project_id}_last_check`) ?? Date.now() - 86400000;

  const response = await httpClient.sendRequest({
    method: 'GET',
    url: `https://api.clockify.me/api/v1/workspaces/${workspace_id}/projects/${project_id}/tasks`,
    headers: { 'X-Api-Key': context.auth as string },
  });

  const tasks = response.body || [];
  const newTasks = tasks.filter((t: any) => {
    const taskTime = t.auditMetadata?.createdAt ?? Date.now();
    return taskTime > lastCheck;
  });

  await context.store?.put(`${project_id}_last_check`, Date.now());
  return newTasks;
}

async function getRunningTimers(context: any) {
  const { workspace_id, user_id } = context.propsValue;
  const knownTimerIds = await context.store?.get(`${workspace_id}_timers`) ?? [];

  const url = `https://api.clockify.me/api/v1/workspaces/${workspace_id}/user/${user_id || 'me'}/time-entries?in-progress=true`;

  const response = await httpClient.sendRequest({
    method: 'GET',
    url,
    headers: { 'X-Api-Key': context.auth as string },
  });

  const timers = response.body || [];
  const newTimers = timers.filter((t: any) => !knownTimerIds.includes(t.id));

  await context.store?.put(`${workspace_id}_timers`, timers.map((t: any) => t.id));
  return newTimers;
}

export const newTimeEntryTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_time_entry',
  displayName: 'New Time Entry',
  description: 'Triggers when a new time entry is created',
  type: TriggerStrategy.POLLING,
  props: {
    workspace_id: workspaceId({
      displayName: 'Workspace',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID (Optional)',
      required: false,
      description: 'Filter by specific user',
    }),
  },
  sampleData: {
    id: '642f1234567890abcdef12345',
    description: 'Work on project',
    start: '2026-03-29T05:00:00Z',
    end: '2026-03-29T07:00:00Z',
    billable: true,
    duration: 'PT2H',
  },
  async test(context) {
    return await getTimeEntries(context);
  },
  async onEnable(context) {
    await context.store?.put(`${context.propsValue.workspace_id}_last_check`, Date.now());
  },
  async onDisable(context) {
    await context.store?.delete(`${context.propsValue.workspace_id}_last_check`);
  },
  async run(context) {
    return await getTimeEntries(context);
  },
});

export const newTaskTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created in a project',
  type: TriggerStrategy.POLLING,
  props: {
    workspace_id: workspaceId({
      displayName: 'Workspace',
      required: true,
    }),
    project_id: projectId({
      displayName: 'Project',
      required: true,
    }),
  },
  sampleData: {
    id: '642f1234567890abcdef12345',
    name: 'Complete implementation',
    status: 'ACTIVE',
    projectId: '642f9876543210fedcba9876',
  },
  async test(context) {
    return await getNewTasks(context);
  },
  async onEnable(context) {
    await context.store?.put(`${context.propsValue.project_id}_last_check`, Date.now());
  },
  async onDisable(context) {
    await context.store?.delete(`${context.propsValue.project_id}_last_check`);
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
    workspace_id: workspaceId({
      displayName: 'Workspace',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID (Optional)',
      required: false,
      description: 'Filter by specific user',
    }),
  },
  sampleData: {
    id: '642f1234567890abcdef12345',
    description: 'Working on feature',
    start: '2026-03-29T05:00:00Z',
  },
  async test(context) {
    return await getRunningTimers(context);
  },
  async onEnable(context) {
    await context.store?.put(`${context.propsValue.workspace_id}_timers`, []);
  },
  async onDisable(context) {
    await context.store?.delete(`${context.propsValue.workspace_id}_timers`);
  },
  async run(context) {
    return await getRunningTimers(context);
  },
});
