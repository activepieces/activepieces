import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth } from '../../index';
import { makeRequest, meisterTaskCommon } from '../common/common';

const getToken = (auth: any): string => {
  return typeof auth === 'string' ? auth : (auth as any).access_token;
};

const newProjectPolling: Polling<
  PiecePropValueSchema<typeof meistertaskAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const token = getToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/projects`,
      token
    );

    const projects = response.body || [];
    return projects.map((project: any) => ({
      epochMilliSeconds: dayjs(project.created_at).valueOf(),
      data: project,
    }));
  },
};

export const newProject = createTrigger({
  auth: meistertaskAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created.',
  props: {},
  sampleData: {
    id: 11223344,
    name: 'Sample Project',
    created_at: '2024-01-15T07:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newProjectPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newProjectPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newProjectPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newProjectPolling, context);
  },
});