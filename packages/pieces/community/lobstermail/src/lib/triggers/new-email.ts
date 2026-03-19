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
    await context.store.put('lastSeenIds', [] as string[]);
  },
  async onDisable(context) {
    await context.store.delete('lastPollTime');
    await context.store.delete('lastSeenIds');
  },
  async test(context) {
    // Fetch the latest emails as sample data for the user
    const params = new URLSearchParams();
    params.set('limit', '5');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes/${context.propsValue.inbox_id}/emails?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    const emails = response.body?.data ?? [];
    return emails.map((email: Record<string, unknown>) => email);
  },
  async run(context) {
    const lastPollTime =
      (await context.store.get<string>('lastPollTime')) ??
      new Date(0).toISOString();
    const lastSeenIds =
      (await context.store.get<string[]>('lastSeenIds')) ?? [];

    // Add 1ms to avoid re-fetching the last email (inclusive filter)
    const sinceDate = new Date(new Date(lastPollTime).getTime() + 1);
    const params = new URLSearchParams();
    params.set('since', sinceDate.toISOString());
    params.set('limit', '50');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes/${context.propsValue.inbox_id}/emails?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    const emails: Record<string, unknown>[] = response.body?.data ?? [];

    // Deduplicate against previously seen IDs
    const newEmails = emails.filter(
      (email) => !lastSeenIds.includes(email['id'] as string),
    );

    if (newEmails.length > 0) {
      // Find the maximum createdAt across all returned emails
      const maxCreatedAt = newEmails.reduce((max, email) => {
        const ts = email['createdAt'] as string;
        return ts > max ? ts : max;
      }, lastPollTime);

      await context.store.put('lastPollTime', maxCreatedAt);
      await context.store.put(
        'lastSeenIds',
        newEmails.map((e) => e['id'] as string),
      );
    }

    return newEmails;
  },
});
