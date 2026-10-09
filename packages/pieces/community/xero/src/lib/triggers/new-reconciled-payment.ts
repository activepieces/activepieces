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

export const xeroNewReconciledPayment = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_reconciled_payment',
  classification: 'READ',
  displayName: 'New Reconciled Payment',
  description: 'Fires when a payment is reconciled for the first time.',
  aiMetadata: {
    description:
      'Fires once per payment when it is first seen as reconciled (IsReconciled false to true) after the trigger is enabled, optionally filtered by payment type, status, invoice, reference or date range. A payment that was already reconciled before enabling and is edited afterwards also fires once, because its earlier state is unknown. Each item is one full payment. Use New Payment to fire when a payment is recorded.',
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
  sampleData: { ...xeroSamples.payment, IsReconciled: true },
  async onEnable(context) {
    await xeroPolling.keepStateOnRepublish({ store: context.store, isRepublish: context.isRepublish, propsValue: context.propsValue });
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    const records = await xeroPolling.fetchRecent(paymentRequest({ accessToken: context.auth.access_token, propsValue: context.propsValue }));
    return records.filter((record) => record['IsReconciled'] === true);
  },
  async run(context) {
    const items = xeroPolling.records({ items: await pollingHelper.poll(polling, context) });
    const tenantId = context.propsValue.tenant_id;
    const previousStateKey = `xero_payment_prev_reconciled_state_${tenantId}`;
    const previousState = xeroTriggerState.readMap({
      value: await context.store.get<unknown>(previousStateKey),
      isValue: (entry): entry is boolean => typeof entry === 'boolean',
    });
    const reconciledNow = items.filter((record) => {
      const id = xeroPolling.idOf({ record, key: 'PaymentID' });
      return id !== undefined && record['IsReconciled'] === true && previousState[id] !== true;
    });
    const nextState = new Map(Object.entries(previousState));
    for (const record of items) {
      const id = xeroPolling.idOf({ record, key: 'PaymentID' });
      if (id === undefined) continue;
      nextState.delete(id);
      nextState.set(id, record['IsReconciled'] === true);
    }
    const emitted = await xeroTriggerState.emitFirstSeen({
      store: context.store,
      key: `xero_payment_reconciled_seen_ids_${tenantId}`,
      items: reconciledNow,
      idOf: (record) => xeroPolling.idOf({ record, key: 'PaymentID' }),
    });
    await context.store.put(previousStateKey, xeroTriggerState.boundMap({ map: Object.fromEntries(nextState) }));
    return emitted;
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
