import { createTrigger, TriggerStrategy, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

interface GmailLabel {
  id: string;
  name: string;
  type: string;
}

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    if (!auth) return [];
    const accessToken = (auth as OAuth2PropertyValue).access_token;

    const response = await httpClient.sendRequest<{ labels: GmailLabel[] }>({
      method: HttpMethod.GET,
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const labels: GmailLabel[] = response.body?.labels ?? [];

    // Convert to polling items and filter older than 2 days just in case
    const nowMinus2Days = dayjs().subtract(2, 'day');
    return labels
      .filter(() => true) // Gmail labels do not carry a date, rely solely on dedupe store
      .map((label) => ({
        epochMilliSeconds: lastFetchEpochMS ?? nowMinus2Days.valueOf(),
        data: label,
      }));
  },
};

export const newLabel = createTrigger({
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when a new label is created in Gmail.',
  props: {},
  sampleData: {
    id: 'Label_123',
    name: 'Important',
    type: 'user',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
