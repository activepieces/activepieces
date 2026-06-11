import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { ynabAuth } from '../auth';
import { ynabCommon, YnabTransaction } from '../common';

export const createTransaction = createAction({
  auth: ynabAuth,
  name: 'create_transaction',
  displayName: 'Create Transaction',
  description: 'Creates a new transaction in a budget account.',
  props: {
    budgetId: ynabCommon.budgetIdDropdown,
    accountId: ynabCommon.accountIdDropdown({
      required: true,
      description: 'The account the transaction belongs to.',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'The transaction amount in your currency (e.g. 10.99). Use a negative number for spending (outflow) and a positive number for income (inflow).',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'The date of the transaction. Defaults to today if left empty.',
      required: false,
    }),
    payeeId: ynabCommon.payeeIdDropdown,
    payeeName: Property.ShortText({
      displayName: 'Payee Name',
      description:
        'Name of the payee (e.g. "Whole Foods"). If no payee with this name exists, a new one is created. Ignored when a Payee is selected above.',
      required: false,
    }),
    categoryId: ynabCommon.categoryIdDropdown({
      required: false,
      description: 'The category to assign the transaction to.',
    }),
    memo: Property.LongText({
      displayName: 'Memo',
      required: false,
    }),
    cleared: Property.StaticDropdown({
      displayName: 'Cleared Status',
      required: false,
      defaultValue: 'uncleared',
      options: {
        options: [
          { label: 'Uncleared', value: 'uncleared' },
          { label: 'Cleared', value: 'cleared' },
          { label: 'Reconciled', value: 'reconciled' },
        ],
      },
    }),
    approved: Property.Checkbox({
      displayName: 'Approved',
      description: 'Whether the transaction is marked as approved in YNAB.',
      required: false,
      defaultValue: true,
    }),
    flagColor: Property.StaticDropdown({
      displayName: 'Flag Color',
      required: false,
      options: {
        options: [
          { label: 'Red', value: 'red' },
          { label: 'Orange', value: 'orange' },
          { label: 'Yellow', value: 'yellow' },
          { label: 'Green', value: 'green' },
          { label: 'Blue', value: 'blue' },
          { label: 'Purple', value: 'purple' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      budgetId,
      accountId,
      amount,
      date,
      payeeId,
      payeeName,
      categoryId,
      memo,
      cleared,
      approved,
      flagColor,
    } = context.propsValue;

    const transactionDate = isNil(date)
      ? new Date().toISOString().slice(0, 10)
      : new Date(date).toISOString().slice(0, 10);

    const response = await ynabCommon.apiCall<{
      data: { transaction: YnabTransaction };
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/budgets/${budgetId}/transactions`,
      body: {
        transaction: {
          account_id: accountId,
          date: transactionDate,
          amount: ynabCommon.toMilliunits({ amount }),
          payee_id: payeeId ?? null,
          payee_name: isNil(payeeId) ? payeeName ?? null : null,
          category_id: categoryId ?? null,
          memo: memo ?? null,
          cleared: cleared ?? 'uncleared',
          approved: approved ?? true,
          flag_color: flagColor ?? null,
        },
      },
    });
    return response.body.data.transaction;
  },
});
