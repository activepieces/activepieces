import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaFields } from '../common/fields';
import { outsetaEnums } from '../common/enums';
import { outsetaListProps } from '../common/list-props';
import { outsetaMappers } from '../common/mappers';
import { outsetaQuery } from '../common/list-query';
import { OutsetaTransaction } from '../common/outseta-types';

export const listTransactionsAction = createAction({
  name: 'list_transactions',
  classification: 'SEARCH',
  auth: outsetaAuth,
  displayName: 'List Account Transactions',
  description:
    "List an account's billing transactions — invoices, payments, refunds and credits — optionally filtered and sorted.",
  audience: 'both',
  aiMetadata: {
    description:
      "Lists one account's billing transactions (invoices, payments, credits, refunds, chargebacks, tax refunds) with optional filters (type, amount range, transaction date range) and sorting. Use for the full history; for the single latest payment use Get Last Payment for Account. Read-only and idempotent.",
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'account',
      display: 'section',
      label: 'Account',
      icon: 'user',
      props: ['accountUid'],
    },
    {
      key: 'transaction',
      display: 'section',
      label: 'Transaction',
      icon: 'filter',
      props: ['transactionType', 'minAmount', 'maxAmount'],
    },
    {
      key: 'dates',
      display: 'section',
      label: 'Dates',
      icon: 'calendar',
      props: ['transactionDateRange'],
    },
    {
      key: 'sort',
      display: 'section',
      label: 'Sort',
      icon: 'sliders',
      props: ['sortBy', 'direction'],
    },
    {
      key: 'paging',
      display: 'section',
      label: 'Paging',
      icon: 'sliders',
      props: ['limit', 'page'],
    },
  ],
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The account whose transactions you want.',
      required: true,
      placeholder: '1QpnM0nW',
    }),
    transactionType: Property.StaticDropdown({
      displayName: 'Type Is',
      required: false,
      icon: 'filter',
      options: {
        disabled: false,
        options: outsetaEnums.billingTransactionType.options,
      },
    }),
    minAmount: Property.Number({
      displayName: 'Amount At Least',
      required: false,
      icon: 'sliders',
    }),
    maxAmount: Property.Number({
      displayName: 'Amount At Most',
      required: false,
      icon: 'sliders',
    }),
    transactionDateRange: Property.DateRange({
      displayName: 'Transaction Date',
      required: false,
      display: 'dropdown',
      icon: 'calendar',
    }),
    sortBy: outsetaListProps.sortBy({
      options: [
        { label: 'Created', value: 'Created' },
        { label: 'Transaction Date', value: 'TransactionDate' },
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
      `/api/v1/billing/transactions/${context.propsValue.accountUid}?${query}&${outsetaFields.transaction}`
    );

    return {
      items: result.items.map(outsetaMappers.transaction),
      ...outsetaQuery.pageInfo(result),
    };
  },
});
