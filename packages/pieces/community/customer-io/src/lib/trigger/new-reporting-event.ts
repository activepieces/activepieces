import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { customerIOAuth } from '../auth';
import { customerIOCommon } from '../common';

const WEBHOOK_ID_STORE_KEY = 'customerio_reporting_webhook_id';

const CUSTOMER_IO_EVENTS: { label: string; value: string }[] = [
  { label: 'Customer — Subscribed', value: 'customer_subscribed' },
  { label: 'Customer — Unsubscribed', value: 'customer_unsubscribed' },
  {
    label: 'Customer — Subscription Preferences Changed',
    value: 'customer_subscription_preferences_changed',
  },
  { label: 'Email — Drafted', value: 'email_drafted' },
  { label: 'Email — Attempted', value: 'email_attempted' },
  { label: 'Email — Sent', value: 'email_sent' },
  { label: 'Email — Delivered', value: 'email_delivered' },
  { label: 'Email — Opened', value: 'email_opened' },
  { label: 'Email — Clicked', value: 'email_clicked' },
  { label: 'Email — Converted', value: 'email_converted' },
  { label: 'Email — Unsubscribed', value: 'email_unsubscribed' },
  { label: 'Email — Bounced', value: 'email_bounced' },
  { label: 'Email — Dropped', value: 'email_dropped' },
  { label: 'Email — Spammed', value: 'email_spammed' },
  { label: 'Email — Failed', value: 'email_failed' },
  { label: 'Email — Undeliverable', value: 'email_undeliverable' },
  { label: 'Push — Drafted', value: 'push_drafted' },
  { label: 'Push — Attempted', value: 'push_attempted' },
  { label: 'Push — Sent', value: 'push_sent' },
  { label: 'Push — Delivered', value: 'push_delivered' },
  { label: 'Push — Opened', value: 'push_opened' },
  { label: 'Push — Clicked', value: 'push_clicked' },
  { label: 'Push — Converted', value: 'push_converted' },
  { label: 'Push — Bounced', value: 'push_bounced' },
  { label: 'Push — Dropped', value: 'push_dropped' },
  { label: 'Push — Failed', value: 'push_failed' },
  { label: 'Push — Undeliverable', value: 'push_undeliverable' },
  { label: 'SMS — Drafted', value: 'sms_drafted' },
  { label: 'SMS — Attempted', value: 'sms_attempted' },
  { label: 'SMS — Sent', value: 'sms_sent' },
  { label: 'SMS — Delivered', value: 'sms_delivered' },
  { label: 'SMS — Clicked', value: 'sms_clicked' },
  { label: 'SMS — Converted', value: 'sms_converted' },
  { label: 'SMS — Bounced', value: 'sms_bounced' },
  { label: 'SMS — Dropped', value: 'sms_dropped' },
  { label: 'SMS — Failed', value: 'sms_failed' },
  { label: 'SMS — Undeliverable', value: 'sms_undeliverable' },
  { label: 'SMS — Replied', value: 'sms_replied' },
  { label: 'WhatsApp — Drafted', value: 'whatsapp_drafted' },
  { label: 'WhatsApp — Attempted', value: 'whatsapp_attempted' },
  { label: 'WhatsApp — Sent', value: 'whatsapp_sent' },
  { label: 'WhatsApp — Delivered', value: 'whatsapp_delivered' },
  { label: 'WhatsApp — Opened', value: 'whatsapp_opened' },
  { label: 'WhatsApp — Clicked', value: 'whatsapp_clicked' },
  { label: 'WhatsApp — Converted', value: 'whatsapp_converted' },
  { label: 'WhatsApp — Bounced', value: 'whatsapp_bounced' },
  { label: 'WhatsApp — Dropped', value: 'whatsapp_dropped' },
  { label: 'WhatsApp — Failed', value: 'whatsapp_failed' },
  { label: 'WhatsApp — Undeliverable', value: 'whatsapp_undeliverable' },
  { label: 'WhatsApp — Replied', value: 'whatsapp_replied' },
  { label: 'Slack — Drafted', value: 'slack_drafted' },
  { label: 'Slack — Attempted', value: 'slack_attempted' },
  { label: 'Slack — Sent', value: 'slack_sent' },
  { label: 'Slack — Clicked', value: 'slack_clicked' },
  { label: 'Slack — Failed', value: 'slack_failed' },
  { label: 'Slack — Undeliverable', value: 'slack_undeliverable' },
  { label: 'Webhook — Drafted', value: 'webhook_drafted' },
  { label: 'Webhook — Attempted', value: 'webhook_attempted' },
  { label: 'Webhook — Sent', value: 'webhook_sent' },
  { label: 'Webhook — Clicked', value: 'webhook_clicked' },
  { label: 'Webhook — Failed', value: 'webhook_failed' },
  { label: 'Webhook — Undeliverable', value: 'webhook_undeliverable' },
  { label: 'In-App — Drafted', value: 'in_app_drafted' },
  { label: 'In-App — Attempted', value: 'in_app_attempted' },
  { label: 'In-App — Sent', value: 'in_app_sent' },
  { label: 'In-App — Opened', value: 'in_app_opened' },
  { label: 'In-App — Clicked', value: 'in_app_clicked' },
  { label: 'In-App — Converted', value: 'in_app_converted' },
  { label: 'In-App — Failed', value: 'in_app_failed' },
  { label: 'In-App — Undeliverable', value: 'in_app_undeliverable' },
];

export const newReportingEvent = createTrigger({
  auth: customerIOAuth,
  name: 'new_reporting_event',
  displayName: 'New Reporting Event',
  description:
    'Fires on a Customer.io reporting-webhook event (delivered, bounced, clicked, …). Subscribe to only the event types you need, and optionally match a single campaign, action, or recipient domain so unrelated events never start a run.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description:
        'Which reporting events Customer.io should send. Only these types are subscribed at the source.',
      required: true,
      options: {
        options: CUSTOMER_IO_EVENTS,
      },
    }),
    campaign_id: Property.Number({
      displayName: 'Campaign ID',
      description:
        'Optional. When set, only events for this campaign start a run; others are dropped before a run is created.',
      required: false,
    }),
    action_id: Property.Number({
      displayName: 'Action ID',
      description:
        'Optional. When set, only events for this action/message start a run.',
      required: false,
    }),
    recipient_domain: Property.ShortText({
      displayName: 'Recipient Domain',
      description:
        'Optional. When set (e.g. "odoo.com"), only events whose recipient email is at this domain start a run.',
      required: false,
    }),
  },
  sampleData: {
    event_id: '01E4C8AY5K21N2QNRBD9YXJ13Z',
    object_type: 'email',
    metric: 'delivered',
    timestamp: 1585254331,
    data: {
      action_id: 489,
      campaign_id: 20,
      customer_id: '0200102',
      identifiers: {
        id: '0200102',
        email: 'user@odoo.com',
        cio_id: 'd9c106000001',
      },
      delivery_id: 'RPILAgABcRhIBqSp7kiPekGBIeVh',
      recipient: 'user@odoo.com',
      subject: 'Welcome to Alan',
    },
  },
  async onEnable(context) {
    const { region, api_bearer_token } = context.auth.props;
    const flowIdentifier = context.webhookUrl
      .split('?')[0]
      .split('/')
      .filter(Boolean)
      .pop();
    const response = await httpClient.sendRequest<{ id: number }>({
      method: HttpMethod.POST,
      url: `${customerIOCommon[region || 'us'].apiUrl}reporting_webhooks`,
      headers: { Authorization: `Bearer ${api_bearer_token}` },
      body: {
        endpoint: context.webhookUrl,
        events: context.propsValue.events,
        name: flowIdentifier ? `Activepieces (${flowIdentifier})` : 'Activepieces',
        disabled: false,
      },
    });
    await context.store.put(WEBHOOK_ID_STORE_KEY, response.body.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<number>(WEBHOOK_ID_STORE_KEY);
    if (!webhookId) {
      return;
    }
    const { region, api_bearer_token } = context.auth.props;
    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${
          customerIOCommon[region || 'us'].apiUrl
        }reporting_webhooks/${webhookId}`,
        headers: { Authorization: `Bearer ${api_bearer_token}` },
      });
    } catch {
      // Webhook may already be deleted — ignore.
    }
  },
  async run(context) {
    const event = context.payload.body as CustomerIoReportingEvent;
    const { campaign_id, action_id, recipient_domain } = context.propsValue;
    const data = event?.data ?? {};

    if (
      campaign_id !== undefined &&
      campaign_id !== null &&
      data.campaign_id !== campaign_id
    ) {
      return [];
    }
    if (
      action_id !== undefined &&
      action_id !== null &&
      data.action_id !== action_id
    ) {
      return [];
    }
    if (recipient_domain && !recipientMatchesDomain(data.recipient, recipient_domain)) {
      return [];
    }
    return [event];
  },
});

function recipientMatchesDomain(
  recipient: string | undefined,
  domain: string
): boolean {
  if (!recipient) {
    return false;
  }
  const normalized = domain.replace(/^@/, '').toLowerCase();
  return recipient.toLowerCase().endsWith(`@${normalized}`);
}

type CustomerIoReportingEvent = {
  event_id?: string;
  object_type?: string;
  metric?: string;
  timestamp?: number;
  data?: {
    campaign_id?: number;
    action_id?: number;
    recipient?: string;
    [key: string]: unknown;
  };
};
