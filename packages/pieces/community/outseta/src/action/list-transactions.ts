import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaEnums } from '../common/enums';
import { outsetaListProps } from '../common/list-props';
import { outsetaMappers } from '../common/mappers';
import { outsetaQuery } from '../common/list-query';
import { OutsetaTransaction } from '../common/outseta-types';

export const listTransactionsAction = createAction({
  name: 'list_transactions',
  auth: outsetaAuth,
  displayName: 'List Account Transactions',
  description:
    "List an account's billing transactions — invoices, payments, refunds and credits — optionally filtered and sorted.",
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists one account's billing transactions (invoices, payments, credits, refunds, chargebacks, tax refunds) with optional filters (type, amount range, transaction date range) and sorting. Use for the full history; for the single latest payment use Get Last Payment for Account. Read-only and idempotent.",
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'transaction',
      display: 'builder',
      label: 'Transaction',
      icon: 'filter',
      props: ['transactionType', 'minAmount', 'maxAmount'],
    },
    {
      key: 'dates',
      display: 'builder',
      label: 'Dates',
      icon: 'calendar',
      props: ['transactionDateRange'],
    },
    {
      key: 'sort',
      display: 'builder',
      label: 'Sort',
      icon: 'sliders',
      props: ['sortBy', 'direction'],
    },
    { key: 'paging', display: 'footer', props: ['limit', 'page'] },
  ],
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The account whose transactions you want.',
      required: true,
      placeholder: '1QpnM0nW',
    }),
    transactionType: Property.StaticDropdown({
      displayName: 'Type is',
      required: false,
      icon: 'filter',
      options: {
        disabled: false,
        options: outsetaEnums.billingTransactionType.options,
      },
    }),
    minAmount: Property.Number({
      displayName: 'Amount at least',
      required: false,
      icon: 'sliders',
    }),
    maxAmount: Property.Number({
      displayName: 'Amount at most',
      required: false,
      icon: 'sliders',
    }),
    transactionDateRange: Property.DateRange({
      displayName: 'Transaction date',
      required: false,
      display: 'dropdown',
      icon: 'calendar',
    }),
    sortBy: outsetaListProps.sortBy({
      options: [
        { label: 'Created', value: 'Created' },
        { label: 'Transaction date', value: 'TransactionDate' },
        { label: 'Amount', value: 'Amount' },
      ],
      defaultValue: 'Created',
    }),
    direction: outsetaListProps.direction(),
    limit: outsetaListProps.limit(),
    page: outsetaListProps.page(),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const query = outsetaQuery.build({
      filters: [
        {
          field: 'BillingTransactionType',
          value: context.propsValue.transactionType,
        },
        { field: 'Amount', operator: 'gte', value: context.propsValue.minAmount },
        { field: 'Amount', operator: 'lte', value: context.propsValue.maxAmount },
        ...outsetaQuery.dateRangeFilters({
          field: 'TransactionDate',
          range: context.propsValue.transactionDateRange,
        }),
      ],
      orderBy: context.propsValue.sortBy,
      orderDirection: context.propsValue.direction,
      limit: context.propsValue.limit,
      page: context.propsValue.page,
    });

    const result = await client.getPage<OutsetaTransaction>(
      `/api/v1/billing/transactions/${context.propsValue.accountUid}?${query}&fields=*,Invoice.Uid,Invoice.Number,Invoice.BillingInvoiceStatus`
    );

    return {
      items: result.items.map(outsetaMappers.transaction),
      ...outsetaQuery.pageInfo(result),
    };
  },
});
