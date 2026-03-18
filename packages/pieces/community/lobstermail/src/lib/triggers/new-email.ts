import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const newEmailTrigger = createTrigger({
  auth: lobstermailAuth,
  name: 'new_email',
  displayName: 'New Email Received',
  description: 'Triggers when a new email is received in an inbox',
  type: TriggerStrategy.POLLING,
  props: {
    inbox_id: Property.ShortText({
      displayName: 'Inbox ID',
      description: 'The inbox to monitor for new emails (e.g. ibx_...)',
      required: true,
    }),
  },
  sampleData: {
    id: 'eml_sample123',
    inboxId: 'ibx_sample456',
    from: 'sender@example.com',
    to: ['you@lobstermail.ai'],
    subject: 'Hello from LobsterMail',
    body: { text: 'This is a sample email body.', html: '<p>This is a sample email body.</p>' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  async onEnable(context) {
    // Store the current timestamp so we only fetch new emails after enabling
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  async onDisable() {
    // Nothing to clean up for polling
  },
  async run(context) {
    const lastPollTime =
      (await context.store.get<string>('lastPollTime')) ??
      new Date(0).toISOString();

    const params = new URLSearchParams();
    params.set('since', lastPollTime);
    params.set('limit', '50');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes/${context.propsValue.inbox_id}/emails?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    const emails = response.body?.data ?? [];

    if (emails.length > 0) {
      // Update the poll timestamp to the latest email's creation time
      const latestEmail = emails[0];
      await context.store.put('lastPollTime', latestEmail.createdAt);
    }

    return emails.map((email: Record<string, unknown>) => email);
  },
});
