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

const statusOptions = [
  { label: 'DRAFT', value: 'DRAFT' },
  { label: 'SUBMITTED', value: 'SUBMITTED' },
  { label: 'AUTHORISED', value: 'AUTHORISED' },
  { label: 'BILLED', value: 'BILLED' },
  { label: 'DELETED', value: 'DELETED' },
];

const triggerProps = {
  tenant_id: props.tenant_id,
  statuses: Property.StaticMultiSelectDropdown({
    displayName: 'Filter by Status (optional)',
    required: false,
    options: { options: statusOptions },
  }),
  first_time_status: Property.StaticDropdown({
    displayName: 'First-time Status (optional)',
    description: 'Also fire when a purchase order enters this status for the first time (since enabling).',
    required: false,
    options: { options: statusOptions },
  }),
  contact_id: props.contact_dropdown(false),
  date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
  date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
  page_size: Property.Number({ displayName: 'Page Size (1-1000)', required: false }),
};

type PurchaseOrderProps = StaticPropsValue<typeof triggerProps>;

const polling: Polling<AppConnectionValueForAuthProperty<typeof xeroAuth>, PurchaseOrderProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const records = await xeroPolling.fetchUpdated({
      ...purchaseOrderRequest({ accessToken: auth.access_token, propsValue }),
      lastFetchEpochMS,
      pageSize: xeroPolling.pageSizeOf({ value: propsValue.page_size, fallback: 200, max: 1000 }),
    });
    return xeroPolling.toItems({ records });
  },
};

export const xeroNewPurchaseOrder = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_purchase_order',
  classification: 'READ',
  displayName: 'New Purchase Order',
  description: 'Fires the first time a purchase order is created or changed after the trigger is turned on, or enters a chosen status for the first time.',
  aiMetadata: {
    description:
      'Fires once per purchase order the first time it is seen after the trigger is enabled, and optionally again when it first enters a chosen status (for example AUTHORISED or BILLED); filters by status, contact or date range. Xero records have no creation time, so a purchase order created before enabling but edited afterwards also fires once. Each item is one full purchase order.',
  },
  props: {
    tenant_id: triggerProps.tenant_id,
    statuses: triggerProps.statuses,
    first_time_status: triggerProps.first_time_status,
    contact_id: triggerProps.contact_id,
    date_from: triggerProps.date_from,
    date_to: triggerProps.date_to,
    page_size: triggerProps.page_size,
  },
  type: TriggerStrategy.POLLING,
  outputSchema: xeroOutputSchemas.purchaseOrder,
  sampleData: xeroSamples.purchaseOrder,
  async onEnable(context) {
    await xeroPolling.keepStateOnRepublish({ store: context.store, isRepublish: context.isRepublish, propsValue: context.propsValue });
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return xeroPolling.fetchRecent(purchaseOrderRequest({ accessToken: context.auth.access_token, propsValue: context.propsValue }));
  },
  async run(context) {
    const items = xeroPolling.records({ items: await pollingHelper.poll(polling, context) });
    const tenantId = context.propsValue.tenant_id;
    const firstStatus = context.propsValue.first_time_status;
    const idOf = (record: Record<string, unknown>) => xeroPolling.idOf({ record, key: 'PurchaseOrderID' });
    const newOnes = await xeroTriggerState.emitFirstSeen({ store: context.store, key: `xero_po_seen_ids_${tenantId}`, items, idOf });
    const enteredStatus = firstStatus
      ? await xeroTriggerState.emitFirstSeen({
          store: context.store,
          key: `xero_po_status_seen_${tenantId}_${firstStatus}`,
          items: items.filter((record) => record['Status'] === firstStatus),
          idOf,
        })
      : [];
    const emittedIds = new Set(newOnes.map(idOf));
    return [...newOnes, ...enteredStatus.filter((record) => !emittedIds.has(idOf(record)))];
  },
});

function purchaseOrderRequest({ accessToken, propsValue }: { accessToken: string; propsValue: PurchaseOrderProps }) {
  const statuses = xeroPolling.stringList({ value: propsValue.statuses });
  const contactId = xeroInput.trimmedOrUndefined({ value: propsValue.contact_id });
  const dateFrom = xeroInput.parseDateInput({ value: propsValue.date_from, field: 'Date From' });
  const dateTo = xeroInput.parseDateInput({ value: propsValue.date_to, field: 'Date To' });
  const where = [
    ...(contactId ? [`Contact.ContactID==${xeroInput.whereGuid({ value: contactId, field: 'Contact' })}`] : []),
    ...(dateFrom ? [`Date>=${xeroInput.whereDate({ value: dateFrom })}`] : []),
    ...(dateTo ? [`Date<${xeroInput.whereDate({ value: dateTo })}`] : []),
    ...(statuses.length > 1 ? xeroPolling.anyOf({ field: 'Status', values: statuses }) : []),
  ];
  return {
    accessToken,
    tenantId: propsValue.tenant_id,
    url: `${XERO_URLS.api}/PurchaseOrders`,
    key: 'PurchaseOrders',
    queryParams: {
      ...(where.length > 0 ? { where: where.join(' AND ') } : {}),
      ...(statuses.length === 1 ? { status: statuses[0] } : {}),
    },
  };
}
