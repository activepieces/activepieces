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
import { meistertaskAuth, getAccessToken } from '../auth';
import { meisterTaskCommon, makeRequest } from '../common/common';

const newLabelPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { project: unknown }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const token = getAccessToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/projects/${propsValue.project}/labels`,
      token
    );

    const labels = Array.isArray(response.body) ? response.body : [];
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
  description: 'Triggers when a new label is created.',
  props: {
    project: meisterTaskCommon.project,
  },
  sampleData: {
    "id": 1,
    "project_id": 15,
    "name": "Bug",
    "color": "ff0000"
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
