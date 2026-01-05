import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { intruderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof intruderAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    if (!lastFetchEpochMS) {
      lastFetchEpochMS = Date.now() - 5 * 60 * 1000;
    }
    const since = dayjs(lastFetchEpochMS).toISOString();

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/issues/?since=${encodeURIComponent(since)}`
    );

    const items = response.results || [];

    return items.map((item: any) => ({
      epochMilliSeconds: dayjs(item.created_at || new Date()).valueOf(),
      data: item,
    }));
  },
};

export const newIssue = createTrigger({
  auth: intruderAuth,
  name: 'newIssue',
  displayName: 'New Issue',
  description: 'Trigger when a new issue is created',
  props: {},
  sampleData: {
    id: 1,
    severity: 'high',
    title: 'Sample Issue',
    description: 'This is a sample issue',
    remediation: 'Apply the recommended fix',
    snoozed: false,
    snooze_reason: null,
    snooze_until: null,
    occurrences: 'https://api.intruder.io/v1/issues/1/occurrences/',
    exploit_likelihood: 'high',
    cvss_score: 7.5,
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
