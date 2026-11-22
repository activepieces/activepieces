import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';

function filterAccounts({
  accounts,
  accountNumber,
  nameContains,
  accountType,
}: {
  accountNumber: number | undefined;
  nameContains: string | undefined;
  accountType: string | undefined;
  accounts: unknown[];
}): Record<string, unknown>[] {
  const needle = nameContains?.toLowerCase();
  const type = accountType?.toLowerCase();
  return accounts.filter((entry): entry is Record<string, unknown> => {
    if (!bokioClient.isRecord(entry)) {
      return false;
    }
    if (accountNumber !== undefined && bokioClient.toOptionalNumber(entry['account']) !== accountNumber) {
      return false;
    }
    if (needle && !String(entry['name'] ?? '').toLowerCase().includes(needle)) {
      return false;
    }
    if (type && String(entry['accountType'] ?? '').toLowerCase() !== type) {
      return false;
    }
    return true;
  });
}

export const listAccounts = createAction({
  auth: bokioAuth,
  name: 'list_accounts',
  classification: 'SEARCH',
  displayName: 'List Chart of Accounts',
  description: 'Lists the bookkeeping accounts of the company, with optional filters.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches the chart of accounts of the Bokio company (account number and name, for example 1930 bank account, 3001 sales 25% VAT). Filter by exact account number, by name contains (case-insensitive) or by account type. Returns up to limit accounts (default 50, max 500) plus totalMatched and truncated=true when more matched; narrow the filters instead of raising the limit. Use it to pick account numbers for journal entry lines and item bookkeeping accounts. Read-only.',
    idempotent: true,
  },
  outputSchema: bokioSchemas.accountList,
  props: {
    accountNumber: Property.ShortText({
      displayName: 'Account Number',
      placeholder: '1930',
      description: 'Exact account number, for example 1930',
      required: false,
    }),
    nameContains: Property.ShortText({
      displayName: 'Name Contains',
      placeholder: 'bank',
      description: 'Case-insensitive text the account name must contain',
      required: false,
    }),
    accountType: Property.ShortText({
      displayName: 'Account Type',
      placeholder: 'e.g. asset',
      description: 'Exact account type as returned by Bokio (case-insensitive)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum accounts to return, 1 to 500. Defaults to 50.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const accountNumberText = bokioBuilders.optionalText(p.accountNumber);
    const accountNumber = bokioClient.toOptionalNumber(accountNumberText);
    if (accountNumberText !== undefined && (accountNumber === undefined || !Number.isInteger(accountNumber))) {
      throw new Error(`Account number must be a whole number (got "${accountNumberText}").`);
    }
    const requestedLimit = bokioClient.toOptionalNumber(p.limit);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(requestedLimit ?? DEFAULT_LIMIT)));
    const body = await bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/chart-of-accounts',
      operation: 'list accounts',
    });
    const matched = filterAccounts({
      accounts: bokioClient.normalizePage<unknown>(body).items,
      accountNumber,
      nameContains: bokioBuilders.optionalText(p.nameContains),
      accountType: bokioBuilders.optionalText(p.accountType),
    });
    return {
      items: matched.slice(0, limit),
      totalMatched: matched.length,
      returned: Math.min(limit, matched.length),
      truncated: matched.length > limit,
    };
  },
});

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;
