import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { currentYear } from '../common';
import { ClockodoClient } from '../common/client';
import { clockodoAuth } from '../../';

interface AuthData {
  email: string;
  token: string;
  company_name: string;
  company_email: string;
}

const polling: Polling<AuthData, unknown> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const client = new ClockodoClient(
      auth.email,
      auth.token,
      auth.company_name,
      auth.company_email
    );
    const time_since = currentYear() - 1 + '-01-01T00:00:00Z';
    const time_until = currentYear() + 1 + '-12-31T23:59:59Z';
    let res = await client.listEntries({ time_since, time_until });
    if (res.paging.count_pages > 1) {
      res = await client.listEntries({
        time_since,
        time_until,
        page: res.paging.count_pages,
      });
    }
    return res.entries
      .sort((a, b) => b.id - a.id)
      .map((a) => ({
        id: a.id,
        data: a,
      }));
  },
};

export default createTrigger({
  auth: clockodoAuth,
  name: 'new_entry',
  displayName: 'New Entry',
  description: 'Triggers when a new time entry is created',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {},
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
