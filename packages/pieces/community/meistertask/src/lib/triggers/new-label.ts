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
import { meisterTaskCommon, makeRequest } from '../common/common';

const getToken = (auth: any): string => {
  return typeof auth === 'string' ? auth : (auth as any).access_token;
};

const newLabelPolling: Polling<
  PiecePropValueSchema<typeof meistertaskAuth>,
  { project: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/projects/${propsValue.project}/task_labels`,
      token
    );

    const labels = response.body || [];
    return labels.map((label: any) => ({
      epochMilliSeconds: dayjs(label.created_at).valueOf(),
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
    id: 22222222,
    name: 'Bug',
    color: '#FF5733',
    project_id: 11223344,
    created_at: '2024-01-15T15:00:00Z',
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