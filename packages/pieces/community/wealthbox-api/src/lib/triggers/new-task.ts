import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import {
  pollingHelper,
  DedupeStrategy,
  Polling
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    if (!auth) {
      throw new Error('Authentication is required');
    }

    const accessToken = (auth as any).access_token;
    if (!accessToken) {
      throw new Error('Access token not found in authentication');
    }

    // Build URL with updated_since parameter for polling
    let url = 'https://api.crmworkspace.com/v1/tasks?per_page=100';

    // Add updated_since parameter if we have a last fetch timestamp
    if (lastFetchEpochMS) {
      const lastFetchDate = dayjs(lastFetchEpochMS).format(
        'YYYY-MM-DD HH:mm:ss'
      );
      url += `&updated_since=${encodeURIComponent(lastFetchDate)}`;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken
        },
        headers: {
          Accept: 'application/json'
        }
      });

      if (response.status >= 400) {
        throw new Error(
          `Wealthbox API error: ${response.status} - ${JSON.stringify(
            response.body
          )}`
        );
      }

      const tasks = response.body.tasks || [];

      // Filter for newly created tasks (not just updated)
      // We'll use created_at timestamp to identify truly new tasks
      const newTasks = tasks.filter((task: any) => {
        if (!lastFetchEpochMS) return true; // First run, return all tasks

        const taskCreatedAt = dayjs(task.created_at).valueOf();
        return taskCreatedAt > lastFetchEpochMS;
      });

      return newTasks.map((task: any) => ({
        epochMilliSeconds: dayjs(task.created_at).valueOf(),
        data: task
      }));
    } catch (error) {
      throw new Error(
        `Failed to fetch tasks: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
};

export const newTask = createTrigger({
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is created',
  type: TriggerStrategy.POLLING,
  props: {
    // Filter options
    assigned_to: Property.Number({
      displayName: 'Assigned To User ID',
      description: 'Only trigger for tasks assigned to this user (optional)',
      required: false
    }),
    assigned_to_team: Property.Number({
      displayName: 'Assigned To Team ID',
      description: 'Only trigger for tasks assigned to this team (optional)',
      required: false
    }),
    created_by: Property.Number({
      displayName: 'Created By User ID',
      description: 'Only trigger for tasks created by this user (optional)',
      required: false
    }),
    task_type: Property.StaticDropdown({
      displayName: 'Task Type',
      description: 'Type of tasks to monitor',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All Tasks', value: 'all' },
          { label: 'Parent Tasks Only', value: 'parents' },
          { label: 'Subtasks Only', value: 'subtasks' }
        ]
      }
    }),
    resource_type: Property.StaticDropdown({
      displayName: 'Linked Resource Type',
      description:
        'Only trigger for tasks linked to this type of resource (optional)',
      required: false,
      options: {
        options: [
          { label: 'Contact', value: 'Contact' },
          { label: 'Project', value: 'Project' },
          { label: 'Opportunity', value: 'Opportunity' }
        ]
      }
    }),
    resource_id: Property.Number({
      displayName: 'Linked Resource ID',
      description:
        'Only trigger for tasks linked to this specific resource ID (optional)',
      required: false
    })
  },
  sampleData: {
    id: 1,
    creator: 1,
    created_at: '2015-05-24 10:00 AM -0400',
    updated_at: '2015-10-12 11:30 PM -0400',
    name: "Return Bill's call",
    due_date: '2015-05-24 11:00 AM -0400',
    complete: false,
    category: 1,
    linked_to: [
      {
        id: 1,
        type: 'Contact',
        name: 'Kevin Anderson'
      }
    ],
    priority: 'Medium',
    visible_to: 'Everyone',
    description: 'Follow up from message...',
    assigned_to: 1,
    assigned_to_team: 10
  },

  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },

  test: async (context) => {
    return await pollingHelper.test(polling, context);
  }
});
