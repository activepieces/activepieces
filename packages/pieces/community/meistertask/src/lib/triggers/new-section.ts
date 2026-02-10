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

const newSectionPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  Record<string, any>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/sections`,
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
  },
  sampleData: {
    "id": 119,
    "name": "Intermediate",
    "description": null,
    "color": "30bfbf",
    "indicator": 7,
    "status": 1,
    "project_id": 66,
    "sequence": -1,
    "created_at": "2017-01-25T13:22:34.559759Z",
    "updated_at": "2017-02-01T09:24:48.453184Z"
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