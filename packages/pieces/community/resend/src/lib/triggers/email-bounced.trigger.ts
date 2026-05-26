import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import crypto from 'crypto';
import { resendAuth } from '../..';

const BASE_URL = 'https://api.resend.com';
const STORE_KEY = 'webhookData';
const TIMESTAMP_TOLERANCE_SECONDS = 300;

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

function verifyResendWebhook({
  rawBody,
  headers,
  signingSecret,
}: {
  rawBody: unknown;
  headers: Record<string, string>;
  signingSecret: string;
}): boolean {
  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(svixTimestamp, 10)) > TIMESTAMP_TOLERANCE_SECONDS) {
    return false;
  }

  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const secretBytes = Buffer.from(signingSecret.replace('whsec_', ''), 'base64');
  const toSign = `${svixId}.${svixTimestamp}.${bodyString}`;
  const computed = crypto.createHmac('sha256', secretBytes).update(toSign).digest('base64');

  return svixSignature.split(' ').some((sig) => {
    const [version, sigValue] = sig.split(',');
    if (version !== 'v1' || !sigValue) return false;
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sigValue, 'base64'),
        Buffer.from(computed, 'base64'),
      );
    } catch {
      return false;
    }
  });
}

export const emailBounced = createTrigger({
  name: 'email_bounced',
  auth: resendAuth,
  displayName: 'Email Event',
  description: 'Triggers when a selected email or contact event occurs in Resend',
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
    await context.store.put(STORE_KEY, {
      id: response.body.id,
      signingSecret: response.body.signing_secret,
    });
  },
  async onDisable(context) {
    const data = await context.store.get<{ id: string; signingSecret: string }>(STORE_KEY);
    if (data?.id) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${BASE_URL}/webhooks/${data.id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
      });
    }
  },
  async run(context) {
    const data = await context.store.get<{ id: string; signingSecret: string }>(STORE_KEY);

    if (
      !verifyResendWebhook({
        rawBody: context.payload.rawBody,
        headers: context.payload.headers,
        signingSecret: data?.signingSecret ?? '',
      })
    ) {
      return [];
    }

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
