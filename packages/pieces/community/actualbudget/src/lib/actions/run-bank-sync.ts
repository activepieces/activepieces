import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { ActualBudgetError, withBudget } from '../common/client';
import { flushWrites, optionalId, queryRows } from '../common/helpers';
import { actualOutputSchemas } from '../common/output-schemas';

export const runBankSync = createAction({
  auth: actualBudgetAuth,
  name: 'run_bank_sync',
  classification: 'WRITE',
  displayName: 'Run Bank Sync',
  description:
    'Pulls new transactions from the bank for one linked account, or for all linked accounts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs bank sync (GoCardless, SimpleFIN or Pluggy, as set up in Actual) for one account_id or, when empty, for every open linked account. New bank transactions are imported into the budget. Fails when the account (or every account) is not linked to a bank. Safe to repeat: Actual matches already-imported bank transactions.',
    idempotent: false,
  },
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Linked account to sync. Leave empty to sync all linked accounts.',
      required: false,
    }),
  },
  outputSchema: actualOutputSchemas.runBankSync,
  async run({ auth, propsValue }) {
    const accountId = optionalId(propsValue.account_id);
    return withBudget({
      auth: auth.props,
      fn: async (api) => {
        const rows = await queryRows({
          api,
          query: api
            .q('accounts')
            .select(['id', 'name', 'closed', 'account_sync_source']),
        });
        const accounts = rows.map((row) => ({
          id: String(row['id']),
          name: String(row['name']),
          closed: Boolean(row['closed']),
          account_sync_source:
            typeof row['account_sync_source'] === 'string'
              ? row['account_sync_source']
              : null,
        }));
        const linked = accounts.filter(
          (a) => a.account_sync_source && !a.closed
        );
        let targets = linked;
        if (accountId) {
          const account = accounts.find((a) => a.id === accountId);
          if (!account) {
            throw new ActualBudgetError(
              `No account with ID "${accountId}" exists in this budget.`,
              'not-found'
            );
          }
          if (!account.account_sync_source) {
            throw new ActualBudgetError(
              `Account "${account.name}" is not linked to a bank. Link it in Actual (account menu → Link account) before running bank sync.`,
              'not-linked'
            );
          }
          targets = [account];
        } else if (linked.length === 0) {
          throw new ActualBudgetError(
            'No open account in this budget is linked to a bank. Link one in Actual (account menu → Link account) first.',
            'not-linked'
          );
        }
        for (const account of targets) {
          await api.runBankSync({ accountId: account.id });
        }
        await flushWrites(api);
        return {
          success: true,
          synced_accounts: targets.map((a) => ({
            id: a.id,
            name: a.name,
            sync_source: a.account_sync_source,
          })),
        };
      },
    });
  },
});
