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
import { XERO_URLS, xeroInput } from '../common/client';
import { xeroPolling } from '../common/polling';
import { xeroSamples } from '../common/samples';
import { xeroTriggerState } from '../common/trigger-state';
import { xeroOutputSchemas } from '../output-schemas';

const triggerProps = {
  tenant_id: props.tenant_id,
  statuses: Property.StaticMultiSelectDropdown({
    displayName: 'Statuses (optional)',
    required: false,
    options: {
      options: [
        { label: 'DRAFT', value: 'DRAFT' },
        { label: 'SUBMITTED', value: 'SUBMITTED' },
        { label: 'AUTHORISED', value: 'AUTHORISED' },
        { label: 'PAID', value: 'PAID' },
        { label: 'VOIDED', value: 'VOIDED' },
        { label: 'DELETED', value: 'DELETED' },
      ],
    },
  }),
  contact_id: props.contact_dropdown(false),
  date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
  date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
  summary_only: Property.Checkbox({ displayName: 'Summary Only (lighter, faster)', required: false, defaultValue: true }),
  page_size: Property.Number({ displayName: 'Page Size (1-1000)', required: false }),
};

type BillProps = StaticPropsValue<typeof triggerProps>;

const polling: Polling<AppConnectionValueForAuthProperty<typeof xeroAuth>, BillProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const records = await xeroPolling.fetchUpdated({
      ...billRequest({ accessToken: auth.access_token, propsValue }),
      lastFetchEpochMS,
      pageSize: xeroPolling.pageSizeOf({ value: propsValue.page_size, fallback: 200, max: 1000 }),
    });
    return xeroPolling.toItems({ records, matches: (record) => record['Type'] === 'ACCPAY' });
  },
};

export const xeroNewBill = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_bill',
  classification: 'READ',
  displayName: 'New Bill',
  description: 'Fires the first time a bill (Accounts Payable) is created or changed after the trigger is turned on.',
  aiMetadata: {
    description:
      'Fires once per supplier bill (Accounts Payable, Type ACCPAY) the first time it is seen after the trigger is enabled, optionally filtered by status, contact or date range; sales invoices are excluded. Xero records have no creation time, so a bill created before enabling but edited afterwards also fires once. Each item is one bill, without line items when Summary Only is on.',
  },
  props: {
    tenant_id: triggerProps.tenant_id,
    statuses: triggerProps.statuses,
    contact_id: triggerProps.contact_id,
    date_from: triggerProps.date_from,
    date_to: triggerProps.date_to,
    summary_only: triggerProps.summary_only,
    page_size: triggerProps.page_size,
  },
  type: TriggerStrategy.POLLING,
  outputSchema: xeroOutputSchemas.invoice,
  sampleData: xeroSamples.bill,
  async onEnable(context) {
    await xeroPolling.keepStateOnRepublish({ store: context.store, isRepublish: context.isRepublish, propsValue: context.propsValue });
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    const records = await xeroPolling.fetchRecent(billRequest({ accessToken: context.auth.access_token, propsValue: context.propsValue }));
    return records.filter((record) => record['Type'] === 'ACCPAY');
  },
  async run(context) {
    const items = xeroPolling.records({ items: await pollingHelper.poll(polling, context) });
    return xeroTriggerState.emitFirstSeen({
      store: context.store,
      key: `xero_bill_seen_ids_${context.propsValue.tenant_id}`,
      items,
      idOf: (record) => xeroPolling.idOf({ record, key: 'InvoiceID' }),
    });
  },
});

function billRequest({ accessToken, propsValue }: { accessToken: string; propsValue: BillProps }) {
  const statuses = xeroPolling.stringList({ value: propsValue.statuses });
  const contactId = xeroInput.trimmedOrUndefined({ value: propsValue.contact_id });
  const dateFrom = xeroInput.parseDateInput({ value: propsValue.date_from, field: 'Date From' });
  const dateTo = xeroInput.parseDateInput({ value: propsValue.date_to, field: 'Date To' });
  const where = [
    'Type=="ACCPAY"',
    ...(dateFrom ? [`Date>=${xeroInput.whereDate({ value: dateFrom })}`] : []),
    ...(dateTo ? [`Date<${xeroInput.whereDate({ value: dateTo })}`] : []),
  ];
  return {
    accessToken,
    tenantId: propsValue.tenant_id,
    url: `${XERO_URLS.api}/Invoices`,
    key: 'Invoices',
    queryParams: {
      where: where.join(' AND '),
      ...(statuses.length > 0 ? { Statuses: statuses.join(',') } : {}),
      ...(contactId ? { ContactIDs: contactId } : {}),
      ...(propsValue.summary_only ? { summaryOnly: 'true' } : {}),
    },
  };
}
