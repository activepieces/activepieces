import { 
  createTrigger, 
  TriggerStrategy, 
  PiecePropValueSchema 
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { PodioTask } from '../common/types';

const polling: Polling<PiecePropValueSchema<typeof podioAuth>, {}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const isTest = lastFetchEpochMS === 0;
    const sinceDate = new Date(lastFetchEpochMS);
    
    // Get all tasks and filter by creation date
    // Podio API requires filtering - get active tasks to meet API requirements
    const response = await podioApiCall<PodioTask[]>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/task/',
      query: {
        limit: isTest ? 5 : 100,
        completed: 'false', // Required filter for Podio API
      },
    });

    const tasks = Array.isArray(response) ? response : [response];
    
    // Filter tasks created since last poll
    const filteredTasks = isTest ? tasks : tasks.filter(task => {
      const createdDate = new Date(task.created_on);
      return createdDate > sinceDate;
    });

    return filteredTasks.map((task) => ({
      epochMilliSeconds: new Date(task.created_on).getTime(),
      data: task,
    }));
  },
};

export const newTaskTrigger = createTrigger({
  auth: podioAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created in Podio.',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  sampleData: {},
});