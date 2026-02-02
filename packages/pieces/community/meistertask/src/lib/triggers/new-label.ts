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
import { meisterTaskCommon, makeRequest } from '../common/common';

const getToken = (auth: any): string => {
  return typeof auth === 'string' ? auth : (auth as any).access_token;
};

const newLabelPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { project: unknown }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/projects/${propsValue.project}/labels`,
      token
    );

    const labels = response.body || [];
    return labels.map((label: any) => ({
      id: label.id,
      data: label,
    }));
  },
};

export const newLabel = createTrigger({
  auth: meistertaskAuth,
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when a label is created.',
  props: {
    project: meisterTaskCommon.project,
  },
  sampleData: {
    "id": 24,
    "project_id": 42,
    "name": "Bug",
    "color": "d93651"
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newLabelPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newLabelPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newLabelPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newLabelPolling, context);
  },
});