import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../../common/auth';
import { withBudget } from '../../common/client';
import { fromCents } from '../../common/helpers';
import { actualOutputSchemas } from '../../common/output-schemas';

export const listAccounts = createAction({
  auth: actualBudgetAuth,
  name: 'list_accounts',
  classification: 'READ',
  displayName: 'List Accounts',
  description: 'Lists accounts with their current balance.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the budget's accounts with id, name, offbudget, closed and current balance (balance = integer cents, balance_decimal = currency units). Use it to find the account ID other tools need. Closed accounts are left out unless include_closed is true. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    include_closed: Property.Checkbox({
      displayName: 'Include Closed Accounts',
      description: 'Also list closed accounts',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: actualOutputSchemas.listAccounts,
  async run(context) {
    const includeClosed = context.propsValue.include_closed === true;
    return withBudget({
      auth: context.auth.props,
      fn: async (api) => {
        const accounts = (await api.getAccounts()).filter(
          (a) => includeClosed || !a.closed
        );
        const rows = [];
        for (const account of accounts) {
          const balance = await api.getAccountBalance(account.id);
          rows.push({
            id: account.id,
            name: account.name,
            offbudget: Boolean(account.offbudget),
            closed: Boolean(account.closed),
            balance,
            balance_decimal: fromCents(balance),
          });
        }
        return { accounts: rows, count: rows.length };
      },
    });
  },
});
