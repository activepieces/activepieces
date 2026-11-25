import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { paymosAuth } from '../actions';
import { extractPaymosCredentials } from '../common/client';
import {
  DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  handlePaymosWebhookTrigger,
  PAYMOS_CANONICAL_WEBHOOK_EVENTS,
  PAYMOS_SEEN_EVENT_IDS_KEY,
  PAYMOS_SEEN_EVENT_IDS_LIMIT,
  validateWebhookSecret,
} from '../common/webhooks';

export {
  DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  handlePaymosWebhookTrigger,
  PAYMOS_CANONICAL_WEBHOOK_EVENTS,
  PAYMOS_SEEN_EVENT_IDS_KEY,
  PAYMOS_SEEN_EVENT_IDS_LIMIT,
};

const WEBHOOK_EVENT_LABELS: Record<
  (typeof PAYMOS_CANONICAL_WEBHOOK_EVENTS)[number],
  string
> = {
  'invoice.awaiting_payment': 'Invoice Awaiting Payment',
  'invoice.confirming': 'Invoice Confirming',
  'invoice.underpaid_waiting': 'Invoice Underpaid Waiting',
  'invoice.paid': 'Invoice Paid',
  'invoice.paid_over': 'Invoice Paid Over',
  'invoice.underpaid': 'Invoice Underpaid',
  'invoice.expired': 'Invoice Expired',
  'invoice.cancelled': 'Invoice Cancelled',
  'invoice.paid_late': 'Invoice Paid Late',
  'payment_channel.deposit.confirming': 'Payment Channel Deposit Confirming',
  'payment_channel.deposit.reorged': 'Payment Channel Deposit Reorged',
  'payment_channel.deposit.confirmed': 'Payment Channel Deposit Confirmed',
  'withdrawal.created': 'Withdrawal Created',
  'withdrawal.processing': 'Withdrawal Processing',
  'withdrawal.completed': 'Withdrawal Completed',
  'withdrawal.failed': 'Withdrawal Failed',
  'withdrawal.cancelled': 'Withdrawal Cancelled',
  'withdrawal.completion_rewound': 'Withdrawal Completion Rewound',
};

const WEBHOOK_EVENT_DROPDOWN_OPTIONS = [
  { label: 'All Events (*)', value: '*' },
  ...PAYMOS_CANONICAL_WEBHOOK_EVENTS.map((eventType) => ({
    label: `${WEBHOOK_EVENT_LABELS[eventType]} (${eventType})`,
    value: eventType,
  })),
];

export const paymosWebhookEventTrigger = createTrigger({
  auth: paymosAuth,
  name: 'paymos_webhook_event',
  displayName: 'Paymos Webhook Event',
  description:
    'Triggers on verified Paymos webhook events. Paymos has no Webhook Management REST API — register this trigger webhook URL manually in Paymos Dashboard → Developer → Webhooks and paste the generated whsec_ signing secret into your Paymos connection.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    setupInstructions: Property.MarkDown({
      value:
        '**Manual Webhook Registration Required** (Paymos has no Webhook Management REST API):\n\n' +
        '1. Copy the live webhook URL shown for this trigger.\n' +
        '2. Open **Paymos Dashboard → Developer → Webhooks**, create an HTTPS endpoint with that URL, and select the desired categories.\n' +
        '3. Copy the generated `whsec_...` signing secret into the **Webhook Signing Secret** field of your Paymos connection.\n\n' +
        'Incoming requests without a valid `X-Webhook-Signature` over the exact raw body (within the timestamp tolerance window) are rejected fail-closed and never trigger the flow. Duplicate `event_id` deliveries are suppressed via persistent FIFO deduplication (up to 500 recent IDs).',
    }),
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more canonical Paymos webhook events (or All Events (*)) that should trigger this flow.',
      required: true,
      defaultValue: ['invoice.paid'],
      options: {
        options: WEBHOOK_EVENT_DROPDOWN_OPTIONS,
      },
    }),
    toleranceSeconds: Property.Number({
      displayName: 'Timestamp Tolerance (Seconds)',
      description:
        'Maximum allowed clock skew in seconds for X-Webhook-Signature verification (default: 300).',
      required: false,
      defaultValue: DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
    }),
  },
  sampleData: {
    event_id: 'evt_01J9SAMPLE000000000000000',
    event_type: 'invoice.paid',
    version: 1,
    occurred_at: 1700000000,
    data: {
      invoice_id: 'inv_74BPZFhr9qy9Uz2fbRkdJX',
      project_id: 'prj_01J9SAMPLEPROJECT',
      status: 'paid',
      is_final: true,
      is_test: false,
      order: {
        external_id: 'order-10042',
        amount: '49.95',
        currency: 'USD',
      },
      payment: {
        network: 'TRC20',
        currency: 'USDT',
        expected: '49.95',
      },
    },
  },
  async onEnable(context) {
    const credentials = extractPaymosCredentials(context.auth);
    validateWebhookSecret(credentials.webhookSecret);
  },
  async onDisable() {
    // Webhooks are managed manually in Paymos Dashboard → Developer → Webhooks.
  },
  async run(context) {
    const credentials = extractPaymosCredentials(context.auth);
    return handlePaymosWebhookTrigger({
      rawBody: context.payload.rawBody,
      headers: context.payload.headers as
        | Record<string, string | string[] | undefined>
        | undefined,
      webhookSecret: credentials.webhookSecret,
      events: context.propsValue.events,
      store: context.store,
      toleranceSeconds:
        typeof context.propsValue.toleranceSeconds === 'number'
          ? context.propsValue.toleranceSeconds
          : DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
    });
  },
});
