import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
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
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  Record<string, any>
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
  sampleData:  {
    "id": 123,
    "token": "s3i5reaF",
    "name": "Getting Started with MeisterTask",
    "notes": "This is just a demo project",
    "status": 1,
    "created_at": "2017-01-13T09:29:36.360375Z",
    "updated_at": "2017-01-16T10:10:21.460697Z"
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