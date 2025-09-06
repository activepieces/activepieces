import { createTrigger,TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { lemlistAuth } from '../common/auth';

export const newActivity = createTrigger({
  name: 'new_activity',
  displayName: 'New Activity',
  description: 'Triggers when a new activity occurs in Lemlist',
  auth: lemlistAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Choose which Lemlist activity should trigger this workflow',
      required: true,
      options: {
        options: [
          { label: 'Emails Opened', value: 'emailsOpened' },
          { label: 'Emails Clicked', value: 'emailsClicked' },
          { label: 'Emails Replied', value: 'emailsReplied' },
          { label: 'Emails Bounced', value: 'emailsBounced' },
          { label: 'Emails Unsubscribed', value: 'emailsUnsubscribed' },
          { label: 'LinkedIn Replied', value: 'linkedinReplied' },
          { label: 'LinkedIn Sent', value: 'linkedinSent' },
          { label: 'LinkedIn Interested', value: 'linkedinInterested' },
          { label: 'LinkedIn Not Interested', value: 'linkedinNotInterested' },
          // you can add more from Lemlist’s docs if needed
        ],
      },
    }),
  },
  sampleData: {
    type: 'emailsOpened',
    campaignId: 'cam_123',
    recipient: 'test@example.com',
    createdAt: '2025-09-06T12:00:00Z',
  },

  async onEnable(context) {
    const apiKey = context.auth as string;
    const eventType = context.propsValue.eventType;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.lemlist.com/api/hooks',
      body: {
        targetUrl: context.webhookUrl,
        type: eventType, 
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: '', 
        password: apiKey, 
      },
    });

    const hook = response.body;
    await context.store.put('hookId', hook._id);
  },

  async onDisable(context) {
    const apiKey = context.auth as string;
    const hookId = await context.store.get('hookId');

    if (hookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.lemlist.com/api/hooks/${hookId}`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: '',
          password: apiKey,
        },
      });
    }
  },

  async run(context) {
    return [context.payload.body];
  },
});
