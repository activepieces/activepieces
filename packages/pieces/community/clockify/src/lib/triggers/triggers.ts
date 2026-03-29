import { PieceProperty } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { Polling } from '@activepieces/pieces-framework';
import { clockifyAuth, workspaceId, projectId } from '../auth';

export const newTimeEntryTrigger = Polling.trigger({
  displayName: 'New Time Entry',
  description: 'Triggers when a new time entry is created',
  props: {
    auth: clockifyAuth,
    workspace_id: workspaceId,
    user_id: PieceProperty.ShortText({
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
  test(context) {
    return Promise.resolve([]);
  },
  async poll(context) {
    const { auth, workspace_id, user_id } = context.propsValue;
    const lastPoll = context.lastPollEpoch ?? Date.now() - 86400000;

    const start = new Date(lastPoll).toISOString();
    const end = new Date().toISOString();

    let url = `https://api.clockify.me/api/v1/workspaces/${workspace_id}/time-entries?start=${start}&end=${end}`;
    if (user_id) {
      url += `&userId=${user_id}`;
    }

    const response = await httpClient.sendRequest({
      method: 'GET',
      url,
      headers: { 'X-Api-Key': auth as string },
    });

    const entries = response.body || [];
    return { epoch: Date.now(), entries };
  },
});

export const newTaskTrigger = Polling.trigger({
  displayName: 'New Task',
  description: 'Triggers when a new task is created in a project',
  props: {
    auth: clockifyAuth,
    workspace_id: workspaceId,
    project_id: projectId,
  },
  sampleData: {
    id: '642f1234567890abcdef12345',
    name: 'Complete implementation',
    status: 'ACTIVE',
    projectId: '642f9876543210fedcba9876',
  },
  test(context) {
    return Promise.resolve([]);
  },
  async poll(context) {
    const { auth, workspace_id, project_id } = context.propsValue;
    const lastPoll = context.lastPollEpoch ?? Date.now() - 86400000;

    const response = await httpClient.sendRequest({
      method: 'GET',
      url: `https://api.clockify.me/api/v1/workspaces/${workspace_id}/projects/${project_id}/tasks`,
      headers: { 'X-Api-Key': auth as string },
    });

    const tasks = response.body || [];
    const newTasks = tasks.filter((t: any) => {
      const taskTime = new Date(t.createdAt || Date.now()).getTime();
      return taskTime > lastPoll;
    });

    return { epoch: Date.now(), entries: newTasks };
  },
});

export const newTimerStartedTrigger = Polling.trigger({
  displayName: 'New Timer Started',
  description: 'Triggers when a new timer is started',
  props: {
    auth: clockifyAuth,
    workspace_id: workspaceId,
  },
  sampleData: {
    id: '642f1234567890abcdef12345',
    description: 'Working on feature',
    start: '2026-03-29T05:00:00Z',
  },
  test(context) {
    return Promise.resolve([]);
  },
  async poll(context) {
    const { auth, workspace_id } = context.propsValue;
    const lastPoll = context.lastPollEpoch ?? Date.now() - 86400000;

    const response = await httpClient.sendRequest({
      method: 'GET',
      url: `https://api.clockify.me/api/v1/workspaces/${workspace_id}/time-entries/in-progress`,
      headers: { 'X-Api-Key': auth as string },
    });

    const timers = response.body || [];
    const newTimers = timers.filter((t: any) => {
      const timerTime = new Date(t.start || Date.now()).getTime();
      return timerTime > lastPoll;
    });

    return { epoch: Date.now(), entries: newTimers };
  },
});
