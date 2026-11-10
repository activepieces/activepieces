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
import { XERO_URLS, xeroInput, xeroValue } from '../common/client';
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
        { label: 'RECEIVE', value: 'RECEIVE' },
        { label: 'SPEND', value: 'SPEND' },
        { label: 'RECEIVE-OVERPAYMENT', value: 'RECEIVE-OVERPAYMENT' },
        { label: 'SPEND-OVERPAYMENT', value: 'SPEND-OVERPAYMENT' },
        { label: 'RECEIVE-PREPAYMENT', value: 'RECEIVE-PREPAYMENT' },
        { label: 'SPEND-PREPAYMENT', value: 'SPEND-PREPAYMENT' },
        { label: 'RECEIVE-TRANSFER', value: 'RECEIVE-TRANSFER' },
        { label: 'SPEND-TRANSFER', value: 'SPEND-TRANSFER' },
      ],
    },
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
  }),
  contact_id: props.contact_dropdown(false),
  bank_account_id: props.bank_account_id(false),
  bank_account_code: Property.ShortText({ displayName: 'Bank Account Code', required: false }),
  date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
  date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
  page_size: Property.Number({ displayName: 'Page Size (1-1000)', required: false }),
};

type BankTransactionProps = StaticPropsValue<typeof triggerProps>;

const polling: Polling<AppConnectionValueForAuthProperty<typeof xeroAuth>, BankTransactionProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const records = await xeroPolling.fetchUpdated({
      ...request({ accessToken: auth.access_token, propsValue }),
      lastFetchEpochMS,
      pageSize: xeroPolling.pageSizeOf({ value: propsValue.page_size, fallback: 200, max: 1000 }),
    });
    const kept = new Set(matching({ records, propsValue }));
    return xeroPolling.toItems({ records, matches: (record) => kept.has(record) });
  },
};

export const xeroNewBankTransaction = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_bank_transaction',
  classification: 'READ',
  displayName: 'New Bank Transaction',
  description: 'Fires the first time a bank transaction is created or changed after the trigger is turned on.',
  aiMetadata: {
    description:
      'Fires once per bank transaction (spend or receive money, overpayment, prepayment or transfer) the first time it is seen after the trigger is enabled, optionally filtered by type, status, contact, bank account or date range. Xero records have no creation time, so a transaction created before enabling but edited afterwards also fires once. Each item is one full bank transaction.',
  },
  props: {
    tenant_id: triggerProps.tenant_id,
    types: triggerProps.types,
    statuses: triggerProps.statuses,
    contact_id: triggerProps.contact_id,
    bank_account_id: triggerProps.bank_account_id,
    bank_account_code: triggerProps.bank_account_code,
    date_from: triggerProps.date_from,
    date_to: triggerProps.date_to,
    page_size: triggerProps.page_size,
  },
  type: TriggerStrategy.POLLING,
  outputSchema: xeroOutputSchemas.bankTransaction,
  sampleData: xeroSamples.bankTransaction,
  async onEnable(context) {
    await xeroPolling.keepStateOnRepublish({ store: context.store, isRepublish: context.isRepublish, propsValue: context.propsValue });
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    const records = await xeroPolling.fetchRecent(request({ accessToken: context.auth.access_token, propsValue: context.propsValue }));
    return matching({ records, propsValue: context.propsValue });
  },
  async run(context) {
    const items = xeroPolling.records({ items: await pollingHelper.poll(polling, context) });
    return xeroTriggerState.emitFirstSeen({
      store: context.store,
      key: `xero_bank_txn_seen_ids_${context.propsValue.tenant_id}`,
      items,
      idOf: (record) => xeroPolling.idOf({ record, key: 'BankTransactionID' }),
    });
  },
});

function request({ accessToken, propsValue }: { accessToken: string; propsValue: BankTransactionProps }) {
  const types = xeroPolling.stringList({ value: propsValue.types });
  const statuses = xeroPolling.stringList({ value: propsValue.statuses });
  const contactId = xeroInput.trimmedOrUndefined({ value: propsValue.contact_id });
  const bankAccountCode = xeroInput.trimmedOrUndefined({ value: propsValue.bank_account_code });
  const dateFrom = xeroInput.parseDateInput({ value: propsValue.date_from, field: 'Date From' });
  const dateTo = xeroInput.parseDateInput({ value: propsValue.date_to, field: 'Date To' });
  const where = [
    ...(types.length === 1 ? [`Type==${xeroInput.whereString({ value: types[0] })}`] : []),
    ...(contactId ? [`Contact.ContactID==${xeroInput.whereGuid({ value: contactId, field: 'Contact' })}`] : []),
    ...(statuses.length > 0 ? [`(${statuses.map((status) => `Status==${xeroInput.whereString({ value: status })}`).join(' OR ')})`] : []),
    ...(dateFrom ? [`Date>=${xeroInput.whereDate({ value: dateFrom })}`] : []),
    ...(dateTo ? [`Date<${xeroInput.whereDate({ value: dateTo })}`] : []),
    ...(bankAccountCode ? [`BankAccount.Code==${xeroInput.whereString({ value: bankAccountCode })}`] : []),
  ];
  return {
    accessToken,
    tenantId: propsValue.tenant_id,
    url: `${XERO_URLS.api}/BankTransactions`,
    key: 'BankTransactions',
    queryParams: xeroPolling.whereParams({ where }),
  };
}

function matching({ records, propsValue }: { records: Record<string, unknown>[]; propsValue: BankTransactionProps }) {
  const types = xeroPolling.stringList({ value: propsValue.types });
  const bankAccountId = xeroInput.trimmedOrUndefined({ value: propsValue.bank_account_id });
  return records.filter((record) => {
    const bankAccount = record['BankAccount'];
    const accountId = xeroValue.isRecord(bankAccount) ? bankAccount['AccountID'] : undefined;
    const typeOk = types.length <= 1 || types.includes(String(record['Type']));
    return typeOk && (bankAccountId === undefined || accountId === bankAccountId);
  });
}
