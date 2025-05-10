import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

export const newTaskTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project',
      required: true,
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async ({ store }) => {
    await store.put('lastFetchedTask', new Date().toISOString());
  },
  onDisable: async () => {
    // Nothing to clean up
  },
  run: async ({ store, auth, propsValue }) => {
    const lastFetchedTask = await store.get('lastFetchedTask') as string;
    const currentTime = new Date().toISOString();

    const tasks = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/workspaces/${propsValue.workspaceId}/projects/${propsValue.projectId}/tasks`
    );

    // Filter tasks that were created after the last check
    const newTasks = tasks.filter((task: any) => {
      const taskCreationTime = new Date(task.timeEstimate ? task.timeEstimate.createdAt : task.dateCreated || task.createdAt).toISOString();
      return taskCreationTime > lastFetchedTask;
    });

    await store.put('lastFetchedTask', currentTime);

    return newTasks.map((task: any) => {
      return {
        id: task.id,
        payload: task,
      };
    });
  },
});
