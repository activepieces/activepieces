import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioListAccounts = createAction({
  auth: bexioAuth,
  name: 'bexio_list_accounts',
  classification: 'SEARCH',
  displayName: 'List Accounts',
  description: 'List chart-of-accounts entries in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists chart-of-accounts entries in Bexio. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.accountListOutputSchema,
  props: {
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/accounts`, limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioSearchAccounts = createAction({
  auth: bexioAuth,
  name: 'bexio_search_accounts',
  classification: 'SEARCH',
  displayName: 'Search Accounts',
  description: 'Search chart-of-accounts entries in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds chart-of-accounts entries matching one or two field criteria (operators like, =, >, in, is_null, ...). Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.accountListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'account_no, name, account_type, fibu_account_group_id' }),
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/2.0/accounts/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioListTaxes = createAction({
  auth: bexioAuth,
  name: 'bexio_list_taxes',
  classification: 'SEARCH',
  displayName: 'List Taxes',
  description: 'List tax rates in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists tax rates in Bexio. Filter types=sales_tax and scope=active for taxes valid on invoices. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.taxListOutputSchema,
  props: {
    ...bexioAi.listProps({}),
    scope: Property.StaticDropdown<string>({ displayName: 'Scope', description: 'Only active or only inactive taxes.', required: false, options: { disabled: false, options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] } }),
    types: Property.StaticDropdown<string>({ displayName: 'Type', description: 'Sales tax or input (pre) tax.', required: false, options: { disabled: false, options: [{ label: 'Sales tax', value: 'sales_tax' }, { label: 'Pre tax', value: 'pre_tax' }] } }),
    date: Property.ShortText({ displayName: 'Valid On', description: 'Only taxes valid on this date. Format YYYY-MM-DD.', required: false }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/3.0/taxes`, limit: propsValue.limit, offset: propsValue.offset, extra: { scope: propsValue.scope ?? undefined, types: propsValue.types ?? undefined, date: propsValue.date ?? undefined } });
  },
});

export const bexioListCurrencies = createAction({
  auth: bexioAuth,
  name: 'bexio_list_currencies',
  classification: 'SEARCH',
  displayName: 'List Currencies',
  description: 'List currencies in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists currencies in Bexio. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.currencyListOutputSchema,
  props: {
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/3.0/currencies`, limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioListManualEntries = createAction({
  auth: bexioAuth,
  name: 'bexio_list_manual_entries',
  classification: 'SEARCH',
  displayName: 'List Manual Entries',
  description: 'List manual journal entries in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists manual journal entries in Bexio. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.manualEntryListOutputSchema,
  props: {
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/3.0/accounting/manual_entries`, limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioCreateManualEntry = createAction({
  auth: bexioAuth,
  name: 'bexio_create_manual_entry',
  classification: 'WRITE',
  displayName: 'Create Manual Entry',
  description: 'Book a manual accounting entry.',
  audience: 'ai',
  aiMetadata: { description: 'Books a manual journal entry (single, compound or group) with debit/credit account lines. This writes to the ledger; each call books another entry, so check bexio_list_manual_entries before retrying.', idempotent: false },
  outputSchema: bexioOutputSchemas.manualEntryOutputSchema,
  props: {
    type: Property.StaticDropdown<string>({ displayName: 'Type', description: 'single = one debit/credit line; compound = several lines with one side shared; group = several independent lines.', required: true, options: { disabled: false, options: [{ label: 'Single', value: 'manual_single_entry' }, { label: 'Compound', value: 'manual_compound_entry' }, { label: 'Group', value: 'manual_group_entry' }] } }),
    date: Property.ShortText({ displayName: 'Date', description: 'Booking date. Format YYYY-MM-DD.', required: true }),
    reference_nr: Property.ShortText({ displayName: 'Reference Number', description: 'Optional reference number.', required: false }),
    entries: Property.Json({ displayName: 'Entries', description: 'JSON array of lines, each {"debit_account_id":1,"credit_account_id":2,"amount":100,"description":"...","tax_id":null,"currency_id":1,"currency_factor":1}. Account IDs from bexio_search_accounts.', required: true }),
  },
  async run({ auth, propsValue }) {
    const body = bexioAi.buildBody({ values: propsValue, fields: { type: 'text', date: 'text', reference_nr: 'text' } });
    const entries = bexioAi.requireArray({ value: propsValue.entries, key: 'entries' });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: '/3.0/accounting/manual_entries', body: { ...body, entries } });
  },
});

export const bexioListBusinessYears = createAction({
  auth: bexioAuth,
  name: 'bexio_list_business_years',
  classification: 'SEARCH',
  displayName: 'List Business Years',
  description: 'List business (fiscal) years in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists business (fiscal) years in Bexio. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.businessYearListOutputSchema,
  props: {
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/3.0/accounting/business_years`, limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioListVatPeriods = createAction({
  auth: bexioAuth,
  name: 'bexio_list_vat_periods',
  classification: 'SEARCH',
  displayName: 'List VAT Periods',
  description: 'List VAT periods in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists VAT periods in Bexio. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.vatPeriodListOutputSchema,
  props: {
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/3.0/accounting/vat_periods`, limit: propsValue.limit, offset: propsValue.offset });
  },
});
