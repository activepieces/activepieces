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

const newSectionPolling: Polling<
  PiecePropValueSchema<typeof meistertaskAuth>,
  { project: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/projects/${propsValue.project}/sections`,
      token
    );

    const sections = response.body || [];
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
  props: {
    project: meisterTaskCommon.project,
  },
  sampleData: {
    id: 87654321,
    name: 'To Do',
    project_id: 11223344,
    created_at: '2024-01-15T08:00:00Z',
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