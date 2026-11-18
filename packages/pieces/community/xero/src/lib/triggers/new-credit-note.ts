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
  types: Property.StaticMultiSelectDropdown({
    displayName: 'Types',
    required: false,
    options: {
      options: [
        { label: 'ACCRECCREDIT (Sales Credit)', value: 'ACCRECCREDIT' },
        { label: 'ACCPAYCREDIT (Supplier Credit)', value: 'ACCPAYCREDIT' },
      ],
    },
  }),
  statuses: Property.StaticMultiSelectDropdown({
    displayName: 'Statuses (optional)',
    required: false,
    options: {
      options: [
        { label: 'DRAFT', value: 'DRAFT' },
        { label: 'AUTHORISED', value: 'AUTHORISED' },
        { label: 'PAID', value: 'PAID' },
        { label: 'VOIDED', value: 'VOIDED' },
      ],
    },
  }),
  contact_id: props.contact_dropdown(false),
  reference: Property.ShortText({ displayName: 'Reference', required: false }),
  date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
  date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
  page_size: Property.Number({ displayName: 'Page Size (1-1000)', required: false }),
};

type CreditNoteProps = StaticPropsValue<typeof triggerProps>;

const polling: Polling<AppConnectionValueForAuthProperty<typeof xeroAuth>, CreditNoteProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const records = await xeroPolling.fetchUpdated({
      ...creditNoteRequest({ accessToken: auth.access_token, propsValue }),
      lastFetchEpochMS,
      pageSize: xeroPolling.pageSizeOf({ value: propsValue.page_size, fallback: 200, max: 1000 }),
    });
    return xeroPolling.toItems({ records });
  },
};

export const xeroNewCreditNote = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_credit_note',
  classification: 'READ',
  displayName: 'New Credit Note',
  description: 'Fires the first time a credit note is created or changed after the trigger is turned on.',
  aiMetadata: {
    description:
      'Fires once per credit note (customer ACCRECCREDIT or supplier ACCPAYCREDIT) the first time it is seen after the trigger is enabled, optionally filtered by type, status, contact, reference or date range. Xero records have no creation time, so a credit note created before enabling but edited afterwards also fires once. Each item is one full credit note.',
  },
  props: {
    tenant_id: triggerProps.tenant_id,
    types: triggerProps.types,
    statuses: triggerProps.statuses,
    contact_id: triggerProps.contact_id,
    reference: triggerProps.reference,
    date_from: triggerProps.date_from,
    date_to: triggerProps.date_to,
    page_size: triggerProps.page_size,
  },
  type: TriggerStrategy.POLLING,
  outputSchema: xeroOutputSchemas.creditNote,
  sampleData: xeroSamples.creditNote,
  async onEnable(context) {
    await xeroPolling.keepStateOnRepublish({ store: context.store, isRepublish: context.isRepublish, propsValue: context.propsValue });
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return xeroPolling.fetchRecent(creditNoteRequest({ accessToken: context.auth.access_token, propsValue: context.propsValue }));
  },
  async run(context) {
    const items = xeroPolling.records({ items: await pollingHelper.poll(polling, context) });
    return xeroTriggerState.emitFirstSeen({
      store: context.store,
      key: `xero_credit_note_seen_ids_${context.propsValue.tenant_id}`,
      items,
      idOf: (record) => xeroPolling.idOf({ record, key: 'CreditNoteID' }),
    });
  },
});

function creditNoteRequest({ accessToken, propsValue }: { accessToken: string; propsValue: CreditNoteProps }) {
  const types = xeroPolling.stringList({ value: propsValue.types });
  const statuses = xeroPolling.stringList({ value: propsValue.statuses });
  const contactId = xeroInput.trimmedOrUndefined({ value: propsValue.contact_id });
  const reference = xeroInput.trimmedOrUndefined({ value: propsValue.reference });
  const dateFrom = xeroInput.parseDateInput({ value: propsValue.date_from, field: 'Date From' });
  const dateTo = xeroInput.parseDateInput({ value: propsValue.date_to, field: 'Date To' });
  const where = [
    ...xeroPolling.anyOf({ field: 'Type', values: types }),
    ...xeroPolling.anyOf({ field: 'Status', values: statuses }),
    ...(contactId ? [`Contact.ContactID==${xeroInput.whereGuid({ value: contactId, field: 'Contact' })}`] : []),
    ...(reference ? [`Reference==${xeroInput.whereString({ value: reference })}`] : []),
    ...(dateFrom ? [`Date>=${xeroInput.whereDate({ value: dateFrom })}`] : []),
    ...(dateTo ? [`Date<${xeroInput.whereDate({ value: dateTo })}`] : []),
  ];
  return {
    accessToken,
    tenantId: propsValue.tenant_id,
    url: `${XERO_URLS.api}/CreditNotes`,
    key: 'CreditNotes',
    queryParams: xeroPolling.whereParams({ where }),
  };
}
