import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest } from '../common/common';

const newSectionPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  Record<string, any>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const token = getAccessToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/sections`,
      token
    );

    const sections = Array.isArray(response.body) ? response.body : [];
    return sections.map((section: any) => ({
      epochMilliSeconds: dayjs(section.created_at).valueOf(),
      data: section,
    }));
  },
};

export const newSection = createTrigger({
  auth: meistertaskAuth,
  name: 'new_section',
  displayName: 'New Section',
  description: 'Triggers when a new section is created.',
  props: {},
  sampleData: {
    "id": 1,
    "name": "Backlog",
    "project_id": 15,
    "created_at": "2023-01-01T00:00:00.000Z"
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newSectionPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newSectionPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newSectionPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newSectionPolling, context);
  },
});
