import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { resendAuth } from '../..';

const BASE_URL = 'https://api.resend.com';

const EVENT_OPTIONS = [
  { label: 'Email Sent', value: 'email.sent' },
  { label: 'Email Delivered', value: 'email.delivered' },
  { label: 'Email Delivery Delayed', value: 'email.delivery_delayed' },
  { label: 'Email Complained', value: 'email.complained' },
  { label: 'Email Bounced', value: 'email.bounced' },
  { label: 'Email Opened', value: 'email.opened' },
  { label: 'Email Clicked', value: 'email.clicked' },
  { label: 'Email Failed', value: 'email.failed' },
  { label: 'Email Received', value: 'email.received' },
  { label: 'Email Scheduled', value: 'email.scheduled' },
  { label: 'Email Suppressed', value: 'email.suppressed' },
  { label: 'Domain Created', value: 'domain.created' },
  { label: 'Domain Updated', value: 'domain.updated' },
  { label: 'Domain Deleted', value: 'domain.deleted' },
  { label: 'Contact Created', value: 'contact.created' },
  { label: 'Contact Updated', value: 'contact.updated' },
  { label: 'Contact Deleted', value: 'contact.deleted' },
];

export const emailBounced = createTrigger({
  name: 'email_bounced',
  auth: resendAuth,
  displayName: 'Email Event',
  description:
    'Triggers when a selected email or contact event occurs in Resend',
  type: TriggerStrategy.WEBHOOK,
  props: {
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description: 'Select one or more event types to subscribe to',
      required: true,
      options: {
        options: EVENT_OPTIONS,
      },
    }),
  },
  async onEnable(context) {
    const response = await httpClient.sendRequest<{
      id: string;
      signing_secret: string;
    }>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body: {
        endpoint: context.webhookUrl,
        events: context.propsValue.events,
      },
    });
    await context.store.put('webhookId', response.body.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${BASE_URL}/webhooks/${webhookId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    type: 'email.bounced',
    created_at: '2024-03-08T09:37:40.912Z',
    data: {
      created_at: '2024-03-08T09:37:40.911Z',
      email_id: '562e3f00-6bad-4910-b1e3-38c2fca1e2ff',
      from: 'onboarding@resend.dev',
      to: ['john@example.com'],
      subject: 'Re: Follow up',
    },
  },
});
