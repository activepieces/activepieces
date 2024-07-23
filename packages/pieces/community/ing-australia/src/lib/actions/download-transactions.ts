import { createAction, Property } from '@activepieces/pieces-framework';

import { ingAustraliaAuth } from '../..';
import { retrieveAuthToken, fetchTransactions } from '../common';

export const downloadTransactions = createAction({
  name: 'downloadTransactions',
  auth: ingAustraliaAuth,
  displayName: 'Download Transactions',
  description:
    'Download bank transactions in multiple formats, such as CSV or OFX.',
  props: {
    account_number: Property.ShortText({
      displayName: 'Account Number',
      required: true,
    }),
    download_format: Property.StaticDropdown({
      displayName: 'Download Format',
      description: 'Select the format to download transactions in',
      required: true,
      options: {
          options: [
              {
                  label: 'CSV (Excel)',
                  value: 'csv'
              },
              {
                  label: 'OFX (MYOB, MS Money)',
                  value: 'ofx'
              },
              {
                label: 'QIF (Quicken)',
                value: 'qif'
              }
          ]
      }
    }),
    search_query: Property.LongText({
      displayName: 'Search query',
      description: 'Query for transactions to download',
      defaultValue: '',
      required: false
  }),
  min_amount: Property.Number({
    displayName: 'Minimum Amount',
    description: 'Enter the minimum amount, in dollars ($)',
    required: false,
  }),
  max_amount: Property.Number({
    displayName: 'Maximum Amount',
    description: 'Enter the maximum amount, in dollars ($)',
    required: false,
  }),
  transaction_type: Property.StaticDropdown({
    displayName: 'Transactions',
    description: 'Select the specific type of of transactions to download',
    required: true,
    options: {
        options: [
            {
              label: 'All',
              value: 0
            },
            {
              label: 'Bank cheques',
              value: 1
            },
            {
              label: 'BPAY payments',
              value: 2
            },
            {
              label: 'Cash and purchases',
              value: 4
            },
            {
              label: 'Cheque deposits',
              value: 3
            },
            {
              label: 'Deposits',
              value: 11
            },
            {
              label: 'Direct debits',
              value: 5
            },
        ]
    }
  }),
  period_in_days: Property.StaticDropdown({
    displayName: 'Period',
    description: 'Select the period of transactions to download',
    required: true,
    options: {
        options: [
            {
              label: 'Last 30 days',
              value: 30
            },
            {
              label: 'Last 60 days',
              value: 60
            },
            {
              label: 'Last 90 days',
              value: 90
            },
            {
              label: 'Last 6 months',
              value: 183
            },
            {
              label: 'Last 12 months',
              value: 365
            },
            {
              label: 'All available (last 5 years)',
              value: 1827
            },
        ]
    }
  }),
  },
  async run(context) {
    const authToken = await retrieveAuthToken(context); 

    const data = await fetchTransactions(
      authToken,
      context.propsValue['account_number'],
      context.propsValue.download_format,
      context.propsValue.search_query ?? '',
      context.propsValue.period_in_days,
      context.propsValue.min_amount ?? '',
      context.propsValue.max_amount ?? '',
      (context.propsValue.transaction_type == 0) ? '' : context.propsValue.transaction_type
    );
    return data;
  },
});
