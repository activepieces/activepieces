import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexExpense } from '../common';

export const listExpenses = createAction({
  auth: brexAuth,
  name: 'list_expenses',
  displayName: 'List Expenses',
  description: 'List expenses, optionally filtered by type and status.',
  props: {
    expense_type: Property.StaticDropdown({
      displayName: 'Expense Type',
      description: 'Only return expenses of this type. Leave empty for all types.',
      required: false,
      options: {
        options: [
          { label: 'Card', value: 'CARD' },
          { label: 'Bill Pay', value: 'BILLPAY' },
          { label: 'Reimbursement', value: 'REIMBURSEMENT' },
          { label: 'Clawback', value: 'CLAWBACK' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return expenses with this status. Leave empty for all statuses.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Out of Policy', value: 'OUT_OF_POLICY' },
          { label: 'Settled', value: 'SETTLED' },
          { label: 'Void', value: 'VOID' },
          { label: 'Canceled', value: 'CANCELED' },
          { label: 'Split', value: 'SPLIT' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of expenses to return (1-100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { expense_type, status, limit } = context.propsValue;
    const queryParams: Record<string, string> = {
      limit: String(limit ?? 50),
    };
    if (expense_type) {
      queryParams['expense_type[]'] = expense_type;
    }
    if (status) {
      queryParams['status[]'] = status;
    }
    const response = await brexCommon.apiCall<{ items: BrexExpense[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v1/expenses?expand[]=merchant',
      queryParams,
    });
    return response.body.items.map(brexCommon.flattenExpense);
  },
});
