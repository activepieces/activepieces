import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostOutput } from '../common/output';
import { AdaptlyPostAccount } from '../common/types';
import { adaptlyPostWebhook } from '../common/webhook';

const EVENT = 'account.unauthorized';

const hooks = adaptlyPostWebhook.hooks({
  events: [EVENT],
  toOutput: (payload) =>
    payload.data.account
      ? {
          ...adaptlyPostWebhook.eventFields(payload),
          ...adaptlyPostOutput.webhookAccount(payload.data.account),
        }
      : undefined,
});

export const accountDisconnectedTrigger = createTrigger({
  auth: adaptlyPostAuth,
  name: 'account_disconnected',
  classification: 'READ',
  displayName: 'Account Needs Reconnecting',
  description:
    'Triggers when a connected social account loses access and has to be reconnected in AdaptlyPost.',
  aiMetadata: {
    description:
      'Fires once when a social account connected to AdaptlyPost stops working, for example after its token expired or a password changed. The payload has the account, its platform and the reason the platform gave. Posts to that account fail until it is reconnected.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: EVENT,
    event_id: 'evt_02',
    occurred_at: '2026-11-01T09:05:12.000Z',
    account_id: 'cm5conn00000000000000000001',
    platform: 'INSTAGRAM',
    display_name: 'AdaptlyPost',
    facebook_page_id: null,
    reason: 'The user changed their password.',
  },
  onEnable: hooks.onEnable,
  onDisable: hooks.onDisable,
  run: hooks.run,
  async test(context) {
    const response = await adaptlyPostClient.request<{
      accounts: AdaptlyPostAccount[];
    }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/social-accounts',
    });
    const unauthorized = response.accounts.filter(
      (account) => account.status === 'unauthorized'
    );
    return (unauthorized.length > 0 ? unauthorized : response.accounts)
      .slice(0, 3)
      .map((account) => ({
        event: EVENT,
        event_id: `test_${account.id}`,
        occurred_at: new Date().toISOString(),
        ...adaptlyPostOutput.webhookAccount({
          id: account.id,
          platform: account.platform,
          displayName: account.displayName,
          pageId: account.pageId,
          reason: account.unauthorizedReason,
        }),
      }));
  },
});
