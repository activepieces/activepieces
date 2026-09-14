import { createAction, Property } from '@activepieces/pieces-framework';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { findLedgerAccountActionOutputSchema } from '../output-schemas';

export const findLedgerAccountAction = createAction({
  auth: sageAccountingAuth,
  name: 'find_ledger_account',
  classification: 'SEARCH',
  displayName: 'Find Ledger Account',
  description: 'Searches for ledger accounts (chart of accounts) in Sage Accounting by nominal code or display name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Accounting ledger accounts (chart of accounts) by nominal code or display name (partial match). Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  outputSchema: findLedgerAccountActionOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Nominal Code or Display Name contains',
      required: false,
    }),
    updatedOrCreatedSince: Property.DateTime({
      displayName: 'Updated or Created Since',
      description: 'Only return ledger accounts changed since this date/time.',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max results',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 200,
    }),
  },
  async run(context) {
    const { search, updatedOrCreatedSince, maxResults } = context.propsValue;
    const { items } = await sageAccountingClient.list<Record<string, unknown>>({
      accessToken: context.auth.access_token,
      path: sageAccountingClient.paths.ledgerAccounts,
      query: {
        ...(search ? { search } : {}),
        ...(updatedOrCreatedSince ? { updated_or_created_since: updatedOrCreatedSince } : {}),
        attributes: 'all',
        items_per_page: String(maxResults ?? 10),
      },
    });

    return items;
  },
});
