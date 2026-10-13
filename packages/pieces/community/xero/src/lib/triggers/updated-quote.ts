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
  statuses: Property.StaticMultiSelectDropdown({
    displayName: 'Filter by Status (optional)',
    required: false,
    options: {
      options: [
        { label: 'DRAFT', value: 'DRAFT' },
        { label: 'SENT', value: 'SENT' },
        { label: 'ACCEPTED', value: 'ACCEPTED' },
        { label: 'DECLINED', value: 'DECLINED' },
        { label: 'INVOICED', value: 'INVOICED' },
        { label: 'DELETED', value: 'DELETED' },
      ],
    },
  }),
  contact_id: props.contact_dropdown(false),
  quote_number: Property.ShortText({ displayName: 'Quote Number (partial match)', required: false }),
  date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
  date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
  expiry_date_from: Property.ShortText({ displayName: 'Expiry Date From (YYYY-MM-DD)', required: false }),
  expiry_date_to: Property.ShortText({ displayName: 'Expiry Date To (YYYY-MM-DD)', required: false }),
  page_size: Property.Number({ displayName: 'Page Size (1-1000)', required: false }),
};

type QuoteProps = StaticPropsValue<typeof triggerProps>;

const polling: Polling<AppConnectionValueForAuthProperty<typeof xeroAuth>, QuoteProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { request, matches } = quoteRequest({ accessToken: auth.access_token, propsValue });
    const records = await xeroPolling.fetchUpdated({
      ...request,
      lastFetchEpochMS,
      pageSize: xeroPolling.pageSizeOf({ value: propsValue.page_size, fallback: 200, max: 1000 }),
    });
    return xeroPolling.toItems({ records, matches });
  },
};

export const xeroUpdatedQuote = createTrigger({
  auth: xeroAuth,
  name: 'xero_updated_quote',
  classification: 'READ',
  displayName: 'Updated Quote',
  description: 'Fires when a quote is created or updated.',
  aiMetadata: {
    description:
      'Fires each time a quote is created or edited after the trigger is enabled (whenever its UpdatedDateUTC moves forward), optionally filtered by status, contact, quote number, or date and expiry ranges. Each item is one full quote; use New Quote to fire only once per quote.',
  },
  props: {
    tenant_id: triggerProps.tenant_id,
    statuses: triggerProps.statuses,
    contact_id: triggerProps.contact_id,
    quote_number: triggerProps.quote_number,
    date_from: triggerProps.date_from,
    date_to: triggerProps.date_to,
    expiry_date_from: triggerProps.expiry_date_from,
    expiry_date_to: triggerProps.expiry_date_to,
    page_size: triggerProps.page_size,
  },
  type: TriggerStrategy.POLLING,
  outputSchema: xeroOutputSchemas.quote,
  sampleData: xeroSamples.quote,
  async onEnable(context) {
    await xeroPolling.keepStateOnRepublish({ store: context.store, isRepublish: context.isRepublish, propsValue: context.propsValue });
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    const { request, matches } = quoteRequest({ accessToken: context.auth.access_token, propsValue: context.propsValue });
    return (await xeroPolling.fetchRecent(request)).filter(matches);
  },
  async run(context) {
    const items = xeroPolling.records({ items: await pollingHelper.poll(polling, context) });
    const key = `xero_quote_prev_updated_${context.propsValue.tenant_id}`;
    const previous = xeroTriggerState.readMap({
      value: await context.store.get<unknown>(key),
      isValue: (entry): entry is number => typeof entry === 'number',
    });
    const next = new Map(Object.entries(previous));
    const emitted = items.filter((record) => {
      const id = xeroPolling.idOf({ record, key: 'QuoteID' });
      if (id === undefined) return false;
      const updated = xeroPolling.epochOf({ record });
      if (updated <= (next.get(id) ?? 0)) return false;
      next.delete(id);
      next.set(id, updated);
      return true;
    });
    await context.store.put(key, xeroTriggerState.boundMap({ map: Object.fromEntries(next) }));
    return emitted;
  },
});

function quoteRequest({ accessToken, propsValue }: { accessToken: string; propsValue: QuoteProps }) {
  return xeroPolling.quoteRequest({
    accessToken,
    tenantId: propsValue.tenant_id,
    statuses: propsValue.statuses,
    contactId: propsValue.contact_id,
    quoteNumber: propsValue.quote_number,
    dateFrom: propsValue.date_from,
    dateTo: propsValue.date_to,
    expiryDateFrom: propsValue.expiry_date_from,
    expiryDateTo: propsValue.expiry_date_to,
  });
}
