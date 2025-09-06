import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { lemlistAuth } from '../common/auth';

export const unsubscribedRecipient = createTrigger({
  name: 'unsubscribed_recipient',
  displayName: 'Unsubscribed Recipient',
  description: 'Triggers when a recipient unsubscribes from Lemlist emails',
  auth: lemlistAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Choose the Lemlist event type to listen for',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Emails Unsubscribed', value: 'emailsUnsubscribed' },
          { label: 'Emails Opened', value: 'emailsOpened' },
          { label: 'Emails Clicked', value: 'emailsClicked' },
          { label: 'Emails Bounced', value: 'emailsBounced' },
          { label: 'Emails Replied', value: 'emailsReplied' },
          { label: 'LinkedIn Message Sent', value: 'linkedinMessageSent' },
          { label: 'LinkedIn Replied', value: 'linkedinReplied' },
        ],
      },
    }),
  },
  sampleData: {
    type: 'emailsUnsubscribed',
    campaignId: 'cam_123',
    recipient: 'unsubscribe@example.com',
    createdAt: '2025-09-06T12:00:00Z',
  },

  async onEnable(context) {
    const { auth, webhookUrl, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.lemlist.com/api/hooks',
      body: {
        targetUrl: webhookUrl,
        type: propsValue.eventType,
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: '',
        password: auth as string,
      },
    });

    const hook = response.body;
    await context.store.put('hookId', hook._id);
  },

  async onDisable(context) {
    const { auth } = context;
    const hookId = await context.store.get('hookId');

    if (hookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.lemlist.com/api/hooks/${hookId}`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: '',
          password: auth as string,
        },
      });
    }
  },

  async run(context) {
    return [context.payload.body];
  },
});
