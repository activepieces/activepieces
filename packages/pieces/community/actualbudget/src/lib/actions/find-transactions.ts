import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { ActualBudgetError, withBudget } from '../common/client';
import {
  loadLookups,
  mapTransaction,
  optionalCents,
  optionalDate,
  optionalId,
  queryTransactions,
  requireDate,
} from '../common/helpers';
import { actualOutputSchemas } from '../common/output-schemas';

const MAX_LIMIT = 500;

export const findTransactions = createAction({
  auth: actualBudgetAuth,
  name: 'find_transactions',
  classification: 'SEARCH',
  displayName: 'Find Transactions',
  description:
    'Finds transactions in a date range, optionally filtered by account, payee, category, amount or text.',
  audience: 'both',
  aiMetadata: {
    description:
      'Finds transactions between start_date and end_date (YYYY-MM-DD, inclusive; end defaults to no limit), newest first. Optional filters: account_id, payee_id, category_id, min/max amount (decimal currency units, negative = expense) and search text matched against notes, payee name and imported payee. Split transactions come back once with their splits under subtransactions; filters match the parent row. Returns up to limit (default 100, max 500) with truncated=true when more matched. Each transaction has amount (integer cents) and amount_decimal. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'YYYY-MM-DD (inclusive)',
      required: true,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'YYYY-MM-DD (inclusive). Leave empty for no end.',
      required: false,
    }),
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'Only this account. Leave empty for all accounts.',
      required: false,
    }),
    payee_id: Property.ShortText({
      displayName: 'Payee ID',
      description: 'Only this payee (ID from Find Payees)',
      required: false,
    }),
    category_id: Property.ShortText({
      displayName: 'Category ID',
      description: 'Only this category',
      required: false,
    }),
    min_amount: Property.Number({
      displayName: 'Minimum Amount',
      description: 'e.g. -100 (currency units; expenses are negative)',
      required: false,
    }),
    max_amount: Property.Number({
      displayName: 'Maximum Amount',
      description: 'e.g. 0 to get only expenses',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search Text',
      description: 'Matched against notes, payee name and imported payee',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `Max transactions to return (1-${MAX_LIMIT}, default 100)`,
      required: false,
      defaultValue: 100,
    }),
  },
  outputSchema: actualOutputSchemas.findTransactions,
  async run({ auth, propsValue }) {
    const start = requireDate({
      value: propsValue.start_date,
      field: 'Start Date',
    });
    const end = optionalDate({ value: propsValue.end_date, field: 'End Date' });
    if (end && end < start) {
      throw new ActualBudgetError(
        'End Date is before Start Date.',
        'invalid-input'
      );
    }
    const min = optionalCents({
      value: propsValue.min_amount,
      field: 'Minimum Amount',
    });
    const max = optionalCents({
      value: propsValue.max_amount,
      field: 'Maximum Amount',
    });
    if (min !== undefined && max !== undefined && min > max) {
      throw new ActualBudgetError(
        'Minimum Amount is greater than Maximum Amount.',
        'invalid-input'
      );
    }
    const rawLimit = propsValue.limit ?? 100;
    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > MAX_LIMIT) {
      throw new ActualBudgetError(
        `Limit must be a whole number from 1 to ${MAX_LIMIT}.`,
        'invalid-input'
      );
    }
    const search = (propsValue.search ?? '').trim();

    const filter: Record<string, unknown> = {
      date: end ? { $gte: start, $lte: end } : { $gte: start },
    };
    const accountId = optionalId(propsValue.account_id);
    const payeeId = optionalId(propsValue.payee_id);
    const categoryId = optionalId(propsValue.category_id);
    if (accountId) filter['account'] = accountId;
    if (payeeId) filter['payee'] = payeeId;
    if (categoryId) filter['category'] = categoryId;
    if (min !== undefined || max !== undefined) {
      filter['amount'] = {
        ...(min !== undefined ? { $gte: min } : {}),
        ...(max !== undefined ? { $lte: max } : {}),
      };
    }
    if (search !== '') {
      const like = `%${search}%`;
      filter['$or'] = [
        { notes: { $like: like } },
        { 'payee.name': { $like: like } },
        { imported_payee: { $like: like } },
      ];
    }

    return withBudget({
      auth: auth.props,
      fn: async (api) => {
        const data = await queryTransactions({
          api,
          query: api
            .q('transactions')
            .filter(filter)
            .select('*')
            .options({ splits: 'grouped' })
            .orderBy([{ date: 'desc' }, { sort_order: 'desc' }])
            .limit(rawLimit + 1),
        });
        const lookups = await loadLookups(api);
        const rows = data
          .slice(0, rawLimit)
          .map((tx) => mapTransaction({ tx, lookups }));
        return {
          transactions: rows,
          count: rows.length,
          truncated: data.length > rawLimit,
        };
      },
    });
  },
});
