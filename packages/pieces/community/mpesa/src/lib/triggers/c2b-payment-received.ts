import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { mpesaAuth, mpesaAuthValue } from '../auth';
import { mpesaPost } from '../common/client';
import { shortCode } from '../common/props';

function callbackUrl(webhookUrl: string, event: 'confirmation' | 'validation'): string {
  const url = new URL(webhookUrl);
  url.searchParams.set('event', event);
  return url.toString();
}

export const c2bPaymentReceived = createTrigger({
  auth: mpesaAuth,
  name: 'c2b_payment_received',
  displayName: 'C2B: Payment Received',
  description: 'Triggers when Safaricom sends a C2B validation or payment confirmation callback.',
  aiMetadata: {
    description: 'Fires for each C2B validation or payment confirmation callback delivered by Safaricom, with one callback payload per event.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    shortCode,
    responseType: Property.StaticDropdown({
      displayName: 'Default Response',
      required: true,
      defaultValue: 'Completed',
      options: {
        options: [
          { label: 'Complete transaction', value: 'Completed' },
          { label: 'Cancel transaction', value: 'Cancelled' },
        ],
      },
    }),
  },
  async onEnable(context) {
    await mpesaPost(mpesaAuthValue(context.auth), '/mpesa/c2b/v1/registerurl', {
      ShortCode: context.propsValue.shortCode,
      ResponseType: context.propsValue.responseType,
      ConfirmationURL: callbackUrl(context.webhookUrl, 'confirmation'),
      ValidationURL: callbackUrl(context.webhookUrl, 'validation'),
    });
  },
  async onDisable() {
    // Daraja does not expose an unregister endpoint. A later registration replaces these URLs.
  },
  async test() {
    return [createC2bSampleData()];
  },
  async run(context) {
    const body = context.payload.body;
    const payload = body !== null && typeof body === 'object' && !Array.isArray(body)
      ? Object.fromEntries(Object.entries(body))
      : {};
    return [{
      event: context.payload.queryParams['event'] ?? 'confirmation',
      ...payload,
    }];
  },
  sampleData: createC2bSampleData(),
});

function createC2bSampleData() {
  return {
    event: 'confirmation',
    TransactionType: 'Pay Bill',
    TransID: 'RKTQDM7W6S',
    TransTime: '20260816123045',
    TransAmount: '1.00',
    BusinessShortCode: '174379',
    BillRefNumber: 'ACTIVE PIECES',
    InvoiceNumber: '',
    OrgAccountBalance: '1000.00',
    ThirdPartyTransID: '',
    MSISDN: '254700000000',
    FirstName: 'Test',
    MiddleName: '',
    LastName: 'Customer',
  };
}
