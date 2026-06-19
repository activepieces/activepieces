import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { linkupAuth, linkupPost, linkupDelete, accountIdProp } from '../common';

const STORE_KEY = '_linkup_invitation_accepted_webhook_id';

export const invitationAccepted = createTrigger({
  auth: linkupAuth,
  name: 'invitation_accepted',
  displayName: 'Invitation Accepted',
  description:
    'Fires in real time when a connection request sent from the connected LinkedIn account is accepted. Registers a LinkupAPI webhook (≈10 credits/day per monitored account while active).',
  type: TriggerStrategy.WEBHOOK,
  props: {
    accountId: accountIdProp,
  },
  sampleData: {
    timestamp: '2026-06-17T12:00:00Z',
    event: {
      type: 'accepted_invitation',
      account_id: 'your-account-id',
      data: {
        profile_url: 'https://www.linkedin.com/in/janedoe',
        first_name: 'Jane',
        last_name: 'Doe',
      },
      timestamp: '2026-06-17T11:59:58Z',
    },
  },
  async onEnable(context) {
    const res = await linkupPost<{ data?: { webhook_id?: string } }>(
      context.auth.secret_text,
      '/webhooks',
      {
        account_id: context.propsValue.accountId,
        url: context.webhookUrl,
        events: ['accepted_invitation'],
      }
    );
    if (res?.data?.webhook_id) {
      await context.store.put<string>(STORE_KEY, res.data.webhook_id);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(STORE_KEY);
    if (webhookId) {
      await linkupDelete(context.auth.secret_text, `/webhooks/${webhookId}`);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
