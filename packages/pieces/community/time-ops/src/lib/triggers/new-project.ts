import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { timeOpsAuth } from '../..';
import { BASE_URL } from '../common';

interface Project {
  id: number;
  name: string | null;
  customerId: number;
  finishedAt: string | null;
  billable: boolean;
  rate: number | null;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof timeOpsAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const response = await httpClient.sendRequest<Project[]>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/Projects`,
      headers: {
        'x-api-key': auth.secret_text,
      },
    });

    const projects = response.body ?? [];

    return projects
      .sort((a, b) => b.id - a.id)
      .map((project) => ({
        id: project.id,
        data: project,
      }));
  },
};

export const newProject = createTrigger({
  auth: timeOpsAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 1,
    name: 'Example Project',
    customerId: 1,
    finishedAt: null,
    billable: true,
    rate: 100,
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
