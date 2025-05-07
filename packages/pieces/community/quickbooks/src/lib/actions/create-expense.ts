import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksCommon } from '../common';

export const createExpense = createAction({
  name: 'create_expense',
  displayName: 'Create Expense',
  description: 'Create a new expense (purchase) in QuickBooks',
  auth: quickbooksAuth,
  props: {
    payee_id: Property.ShortText({
      displayName: 'Payee ID',
      description: 'The ID of the vendor or employee who was paid',
      required: true,
    }),
    payee_type: Property.StaticDropdown({
      displayName: 'Payee Type',
      description: 'The type of entity that was paid',
      required: true,
      options: {
        options: [
          { label: 'Vendor', value: 'Vendor' },
          { label: 'Employee', value: 'Employee' },
        ],
      },
    }),
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'The ID of the account to record this expense against',
      required: true,
    }),
    payment_type: Property.StaticDropdown({
      displayName: 'Payment Type',
      description: 'The type of payment',
      required: true,
      options: {
        options: [
          { label: 'Check', value: 'Check' },
          { label: 'Credit Card', value: 'CreditCard' },
          { label: 'Cash', value: 'Cash' },
        ],
      },
    }),
    expense_date: Property.DateTime({
      displayName: 'Expense Date',
      description: 'The date of the expense (defaults to today)',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The total amount of the expense',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the expense',
      required: false,
    }),
    category_id: Property.ShortText({
      displayName: 'Category ID',
      description: 'The ID of the expense category (account)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      payee_id,
      payee_type,
      account_id,
      payment_type,
      expense_date,
      amount,
      description,
      category_id
    } = propsValue;

    // Create the expense data
    const expenseData: any = {
      PaymentType: payment_type,
      AccountRef: {
        value: account_id,
      },
      TotalAmt: amount,
    };

    // Set the entity reference based on payee type
    if (payee_type === 'Vendor') {
      expenseData.EntityRef = {
        value: payee_id,
        type: 'Vendor',
      };
    } else if (payee_type === 'Employee') {
      expenseData.EntityRef = {
        value: payee_id,
        type: 'Employee',
      };
    }

    if (expense_date) {
      expenseData.TxnDate = expense_date;
    }

    if (description) {
      expenseData.PrivateNote = description;
    }

    // Add line details
    expenseData.Line = [
      {
        DetailType: 'AccountBasedExpenseLineDetail',
        Amount: amount,
        Description: description || '',
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value: category_id || account_id,
          },
        },
      },
    ];

    // Create the expense (Purchase)
    return await quickbooksCommon.makeRequest({
      auth: auth,
      method: HttpMethod.POST,
      path: 'purchase',
      body: expenseData,
    });
  },
});
