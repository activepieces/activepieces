import {
  AppConnectionValueForAuthProperty,
  Property,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { xeroPolling } from '../common/polling';
import { xeroSamples } from '../common/samples';
import { xeroTriggerState } from '../common/trigger-state';
import { xeroOutputSchemas } from '../output-schemas';

const triggerProps = {
  tenant_id: props.tenant_id,
  payment_types: Property.StaticMultiSelectDropdown({
    displayName: 'Payment Types',
    required: false,
    options: {
      options: [
        { label: 'ACCRECPAYMENT (Received on Sales Invoice)', value: 'ACCRECPAYMENT' },
        { label: 'ACCPAYPAYMENT (Paid on Bill)', value: 'ACCPAYPAYMENT' },
      ],
    },
    defaultValue: ['ACCRECPAYMENT'],
  }),
  statuses: Property.StaticMultiSelectDropdown({
    displayName: 'Statuses',
    required: false,
    options: {
      options: [
        { label: 'AUTHORISED', value: 'AUTHORISED' },
        { label: 'DELETED', value: 'DELETED' },
      ],
    },
    defaultValue: ['AUTHORISED'],
  }),
  invoice_id: props.invoice_id(false),
  reference: Property.ShortText({ displayName: 'Reference', required: false }),
  date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
  date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
  page_size: Property.Number({ displayName: 'Page Size (1-1000)', required: false }),
};

type PaymentProps = StaticPropsValue<typeof triggerProps>;

const polling: Polling<AppConnectionValueForAuthProperty<typeof xeroAuth>, PaymentProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const records = await xeroPolling.fetchUpdated({
      ...paymentRequest({ accessToken: auth.access_token, propsValue }),
      lastFetchEpochMS,
      pageSize: xeroPolling.pageSizeOf({ value: propsValue.page_size, fallback: 200, max: 1000 }),
    });
    return xeroPolling.toItems({ records });
  },
};

export const xeroNewPayment = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_payment',
  classification: 'READ',
  displayName: 'New Payment',
  description: 'Fires the first time a payment is recorded or changed after the trigger is turned on.',
  aiMetadata: {
    description:
      'Fires once per payment the first time it is seen after the trigger is enabled, optionally filtered by payment type (received on sales invoices or paid on bills), status, invoice, reference or date range. Xero records have no creation time, so a payment recorded before enabling but edited afterwards also fires once. Each item is one full payment with its invoice and bank account.',
  },
  props: {
    tenant_id: triggerProps.tenant_id,
    payment_types: triggerProps.payment_types,
    statuses: triggerProps.statuses,
    invoice_id: triggerProps.invoice_id,
    reference: triggerProps.reference,
    date_from: triggerProps.date_from,
    date_to: triggerProps.date_to,
    page_size: triggerProps.page_size,
  },
  type: TriggerStrategy.POLLING,
  outputSchema: xeroOutputSchemas.payment,
  sampleData: xeroSamples.payment,
  async onEnable(context) {
    await xeroPolling.keepStateOnRepublish({ store: context.store, isRepublish: context.isRepublish, propsValue: context.propsValue });
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return xeroPolling.fetchRecent(paymentRequest({ accessToken: context.auth.access_token, propsValue: context.propsValue }));
  },
  async run(context) {
    const items = xeroPolling.records({ items: await pollingHelper.poll(polling, context) });
    return xeroTriggerState.emitFirstSeen({
      store: context.store,
      key: `xero_payment_seen_ids_${context.propsValue.tenant_id}`,
      items,
      idOf: (record) => xeroPolling.idOf({ record, key: 'PaymentID' }),
    });
  },
});

function paymentRequest({ accessToken, propsValue }: { accessToken: string; propsValue: PaymentProps }) {
  return xeroPolling.paymentRequest({
    accessToken,
    tenantId: propsValue.tenant_id,
    paymentTypes: propsValue.payment_types,
    statuses: propsValue.statuses,
    invoiceId: propsValue.invoice_id,
    reference: propsValue.reference,
    dateFrom: propsValue.date_from,
    dateTo: propsValue.date_to,
  });
}
