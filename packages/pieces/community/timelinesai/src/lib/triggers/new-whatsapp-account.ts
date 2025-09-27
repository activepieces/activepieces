import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { timelinesaiAuth } from '../common/auth';
import { newWhatsAppAccount as newWhatsAppAccountProps } from '../common/properties';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { timelinesaiCommon } = await import('../common/client');

    const isTest = lastFetchEpochMS === 0;
    const accounts = await timelinesaiCommon.getWhatsAppAccounts({ auth }) as any[];

    const newAccounts = accounts.filter((account: any) => {
      const createdAfterLastFetch = !lastFetchEpochMS || new Date(account.created_at).getTime() > lastFetchEpochMS;
      return isTest || createdAfterLastFetch;
    });

    return newAccounts.map((account: any) => ({
      epochMilliSeconds: new Date(account.created_at).getTime(),
      data: account,
    }));
  },
};

export const newWhatsAppAccount = createTrigger({
  auth: timelinesaiAuth,
  name: 'newWhatsAppAccount',
  displayName: 'New WhatsApp Account',
  description: 'Fires when a new WhatsApp account is added/registered',
  props: newWhatsAppAccountProps(),
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 'wa_123',
    name: 'Business Account',
    phone_number: '+1234567890',
    status: 'active',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
  },
});
