import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const createWebhook = createAction({
  auth: lobstermailAuth,
  name: 'create_webhook',
  displayName: 'Create Webhook',
  description: 'Register a webhook for LobsterMail email events',
  props: {
    url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'HTTPS endpoint to receive event notifications',
      required: true,
    }),
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description: 'Events to subscribe to',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Email Received', value: 'email.received' },
          { label: 'Email Sent', value: 'email.sent' },
          { label: 'Email Bounced', value: 'email.bounced' },
          { label: 'Email Quarantined', value: 'email.quarantined' },
          { label: 'Scan Complete', value: 'email.scan.complete' },
          { label: 'New Thread', value: 'email.thread.new' },
          { label: 'Thread Reply', value: 'email.thread.reply' },
          { label: 'Inbox Created', value: 'inbox.created' },
          { label: 'Inbox Expired', value: 'inbox.expired' },
        ],
      },
    }),
    inbox_id: Property.ShortText({
      displayName: 'Inbox ID',
      description: 'Limit webhook to a specific inbox (omit for account-wide)',
      required: false,
    }),
  },
  async run(context) {
    const { url, events, inbox_id } = context.propsValue;

    const body: Record<string, unknown> = { url, events };
    if (inbox_id) body['inboxId'] = inbox_id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${lobstermailCommon.baseUrl}/v1/webhooks`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
