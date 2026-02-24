import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freeAgentAuth } from '../../index';

const props = {
  status: Property.StaticDropdown({
    displayName: 'Task Status',
    description: 'Filter tasks by status',
    required: false,
    options: {
      options: [
        { label: 'All Tasks', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
    defaultValue: 'all',
  }),
};

type PropsValue = {
  status?: string;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freeAgentAuth>,
  PropsValue
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { status } = propsValue;

    let url = 'https://api.freeagent.com/v2/tasks?';

    if (status && status !== 'all') {
      url += `view=${status}&`;
    }

    if (lastFetchEpochMS > 0) {
      const updatedSince = new Date(lastFetchEpochMS).toISOString();
      url += `updated_since=${encodeURIComponent(updatedSince)}&`;
    }

    url = url.replace(/&$/, '');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    const tasks = response.body['tasks'] || [];

    return tasks.map((task: { created_at: string }) => ({
      epochMilliSeconds: new Date(task.created_at).getTime(),
      data: task,
    }));
  },
};

export const freeAgentNewTaskTrigger = createTrigger({
  auth: freeAgentAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is added',
  type: TriggerStrategy.POLLING,
  props,
  sampleData: {
    url: 'https://api.freeagent.com/v2/tasks/1',
    project: 'https://api.freeagent.com/v2/projects/1',
    name: 'Sample Task',
    currency: 'GBP',
    is_billable: true,
    billing_rate: '0.0',
    billing_period: 'hour',
    status: 'Active',
    created_at: '2011-08-16T11:06:57Z',
    updated_at: '2011-08-16T11:06:57Z',
    is_deletable: false,
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
