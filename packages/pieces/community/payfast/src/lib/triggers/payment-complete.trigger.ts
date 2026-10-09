import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { payfastAuth } from '../auth';
import { payfastSignature } from '../common/signature';

const TRIGGER_KEY = 'payfast-payment-complete';

export const paymentCompleteTrigger = createTrigger({
  auth: payfastAuth,
  name: 'payment_complete',
  displayName: 'Payment Complete',
  description:
    'Triggers when PayFast sends an Instant Transaction Notification (ITN) confirming a payment.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    m_payment_id: 'INV-1001',
    pf_payment_id: '1234567',
    payment_status: 'COMPLETE',
    item_name: 'Monthly Subscription',
    item_description: 'Synkra Flow Business plan',
    amount_gross: '599.00',
    amount_fee: '-13.78',
    amount_net: '585.22',
    custom_str1: '',
    custom_str2: '',
    custom_str3: '',
    custom_str4: '',
    custom_str5: '',
    custom_int1: '',
    custom_int2: '',
    custom_int3: '',
    custom_int4: '',
    custom_int5: '',
    name_first: 'Jane',
    name_last: 'Smith',
    email_address: 'jane@example.com',
    merchant_id: '10000100',
    signature: 'abc123def456',
  },

  async onEnable(context) {
    // PayFast has no remote webhook registration. The merchant supplies
    // notify_url per transaction. We store the URL so users can copy it.
    await context.store.put(TRIGGER_KEY, {
      url: context.webhookUrl,
      enabledAt: new Date().toISOString(),
    });
  },

  async onDisable(context) {
    await context.store.delete(TRIGGER_KEY);
  },

  async run(context) {
    const raw = context.payload.body as Record<string, unknown> | undefined;
    if (!raw) return [];

    // PayFast sends form-urlencoded. Normalise to a plain object.
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v === undefined || v === null) continue;
      data[k] = String(v);
    }

    // Verify signature against our passphrase.
    const incomingSig = data['signature'];
    if (!incomingSig) {
      console.warn('payfast: ITN arrived without a signature. Rejecting.');
      return [];
    }

    const fieldsForSig: Record<string, string> = { ...data };
    delete fieldsForSig['signature'];
    const expected = payfastSignature(fieldsForSig, context.auth.props.passphrase);

    if (expected !== incomingSig) {
      console.warn(
        `payfast: ITN signature mismatch for ${data['m_payment_id']}. Rejecting.`,
      );
      return [];
    }

    // PayFast expects a bare 200 with no body to acknowledge the ITN.
    // The engine handles the HTTP response; we simply emit one event.
    return [data];
  },

  async test(context) {
    return [
      {
        m_payment_id: 'TEST-INV-001',
        pf_payment_id: '9999999',
        payment_status: 'COMPLETE',
        item_name: 'Test Item',
        amount_gross: '100.00',
        amount_fee: '-2.30',
        amount_net: '97.70',
        email_address: 'test@example.com',
        name_first: 'Test',
        name_last: 'Customer',
        merchant_id: context.auth.props.merchant_id,
      },
    ];
  },
});
