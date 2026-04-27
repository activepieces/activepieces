import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall, WafeqPaginatedResponse } from '../common/client';
import { wafeqHelpers } from '../common/helpers';

export const listAccounts = createAction({
  auth: wafeqAuth,
  name: 'list_accounts',
  displayName: 'List Accounts',
  description:
    'List accounts from your Wafeq chart of accounts. Useful for exporting your chart of accounts or finding account IDs you need elsewhere.',
  props: {
    classification: Property.StaticDropdown({
      displayName: 'Account Type',
      description:
        'Filter to one kind of account. Revenue = sales accounts, Expense = cost accounts, Asset = bank / inventory, Liability = loans / payables, Equity = owner\'s capital.',
      required: false,
      options: {
        options: [
          { label: 'Any', value: '' },
          { label: 'Revenue (sales)', value: 'REVENUE' },
          { label: 'Expense (costs)', value: 'EXPENSE' },
          { label: 'Asset (bank, cash, inventory)', value: 'ASSET' },
          { label: 'Liability (loans, payables)', value: 'LIABILITY' },
          { label: 'Equity (owner capital)', value: 'EQUITY' },
        ],
      },
    }),
    is_payment_enabled: Property.StaticDropdown({
      displayName: 'Payment-Enabled Only?',
      description:
        'Payment-enabled accounts are the bank, cash, or card accounts you can receive or send money from.',
      required: false,
      options: {
        options: [
          { label: 'Any', value: '' },
          { label: 'Only payment-enabled (bank, cash, card)', value: 'true' },
          { label: 'Only non-payment accounts', value: 'false' },
        ],
      },
    }),
    external_id: Property.ShortText({
      displayName: 'Your Reference ID (optional)',
      description:
        'Return the single account matching this reference ID (if you\'ve stored one).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'How many accounts to return at most. Default is 100, maximum is 500.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const queryParams = wafeqHelpers.stripEmpty({
      classification: p.classification,
      is_payment_enabled: p.is_payment_enabled,
      external_id: p.external_id,
      page_size: String(Math.min(Math.max(p.limit ?? 100, 1), 500)),
    }) as Record<string, string>;
    const response = await wafeqApiCall<WafeqPaginatedResponse<ListedAccount>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/accounts/',
      queryParams,
    });
    return {
      total: response.body.count,
      returned: response.body.results.length,
      results: response.body.results.map((a) => ({
        id: a.id,
        account_code: a.account_code ?? null,
        name_en: a.name_en ?? null,
        name_ar: a.name_ar ?? null,
        classification: a.classification ?? null,
        account_type: a.account_type ?? null,
        is_payment_enabled: a.is_payment_enabled ?? null,
        is_posting: a.is_posting ?? null,
        is_system: a.is_system ?? null,
        is_locked: a.is_locked ?? null,
        parent_id: a.parent ?? null,
        external_id: a.external_id ?? null,
        created_ts: a.created_ts ?? null,
        modified_ts: a.modified_ts ?? null,
      })),
    };
  },
});

type ListedAccount = {
  id: string;
  account_code?: string;
  name_en?: string;
  name_ar?: string;
  classification?: string;
  account_type?: string;
  is_payment_enabled?: boolean;
  is_posting?: boolean;
  is_system?: boolean;
  is_locked?: boolean;
  parent?: string;
  external_id?: string;
  created_ts?: string;
  modified_ts?: string;
};
