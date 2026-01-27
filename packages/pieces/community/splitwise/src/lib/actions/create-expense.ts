import { createAction, Property } from '@activepieces/pieces-framework';
import { splitwiseAuth } from '../../index';
import { splitwiseApi } from '../common/api';

export const createExpenseAction = createAction({
  auth: splitwiseAuth,
  name: 'create_expense',
  displayName: 'Create Expense',
  description: 'Creates a new expense, optionally in a group or with specific friends',
  props: {
    split_type: Property.StaticDropdown({
      displayName: 'Split Type',
      description: 'How to split the expense',
      required: true,
      options: {
        options: [
          { label: 'Split equally in group', value: 'equal_group_split' },
          { label: 'Split by custom shares', value: 'by_shares' },
        ],
      },
      defaultValue: 'equal_group_split',
    }),
    cost: Property.ShortText({
      displayName: 'Cost',
      description: 'Amount (e.g., "25.50")',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Short description of the expense',
      required: true,
    }),
    details: Property.LongText({
      displayName: 'Details/Notes',
      description: 'Additional notes about the expense',
      required: false,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'Date and time the expense took place',
      required: false,
    }),
    repeat_interval: Property.StaticDropdown({
      displayName: 'Repeat Interval',
      description: 'How often to repeat this expense',
      required: false,
      options: {
        options: [
          { label: 'Never', value: 'never' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Fortnightly', value: 'fortnightly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Yearly', value: 'yearly' },
        ],
      },
      defaultValue: 'never',
    }),
    currency_code: Property.ShortText({
      displayName: 'Currency Code',
      description: 'Currency code (e.g., USD, EUR)',
      required: false,
      defaultValue: 'USD',
    }),
    category_id: Property.Dropdown({
      displayName: 'Category',
      description: 'Expense category',
      required: false,
      auth: splitwiseAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        try {
          const categories = await splitwiseApi.getCategories(auth.secret_text);
          return {
            options: categories.map((cat: any) => ({
              label: cat.name,
              value: cat.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load categories',
            options: [],
          };
        }
      },
    }),
    group_id: Property.Dropdown({
      displayName: 'Group',
      description: 'Group to put this expense in (required for equal split)',
      required: true,
      auth: splitwiseAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        try {
          const groups = await splitwiseApi.getGroups(auth.secret_text);
          return {
            options: groups.map((group: any) => ({
              label: group.name,
              value: group.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load groups',
            options: [],
          };
        }
      },
    }),
    // Custom shares - only shown when split_type is 'by_shares'
    users: Property.Array({
      displayName: 'Users (Custom Split)',
      description: 'Users and their shares for custom split (only used when Split Type is "by_shares")',
      required: false,
      properties: {
        user_id: Property.Number({
          displayName: 'User ID',
          description: 'Splitwise user ID',
          required: false,
        }),
        first_name: Property.ShortText({
          displayName: 'First Name',
          description: 'User first name (if no user ID)',
          required: false,
        }),
        last_name: Property.ShortText({
          displayName: 'Last Name',
          description: 'User last name (if no user ID)',
          required: false,
        }),
        email: Property.ShortText({
          displayName: 'Email',
          description: 'User email (if no user ID)',
          required: false,
        }),
        paid_share: Property.ShortText({
          displayName: 'Paid Share',
          description: 'Amount this user paid (e.g., "25.50")',
          required: true,
        }),
        owed_share: Property.ShortText({
          displayName: 'Owed Share',
          description: 'Amount this user owes (e.g., "12.75")',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { split_type, cost, description, details, date, repeat_interval, currency_code, category_id, group_id, users } = context.propsValue;

    const expenseData: any = {
      cost,
      description,
      group_id,
    };

    if (details) expenseData.details = details;
    if (date) expenseData.date = date;
    if (repeat_interval && repeat_interval !== 'never') expenseData.repeat_interval = repeat_interval;
    if (currency_code) expenseData.currency_code = currency_code;
    if (category_id) expenseData.category_id = category_id;

    if (split_type === 'equal_group_split') {
      expenseData.split_equally = true;
    } else if (split_type === 'by_shares' && users && users.length > 0) {
      expenseData.split_equally = false;
      // Add users array with proper formatting
      users.forEach((user: any, index: number) => {
        if (user.user_id) {
          expenseData[`users__${index}__user_id`] = user.user_id;
        }
        if (user.first_name) {
          expenseData[`users__${index}__first_name`] = user.first_name;
        }
        if (user.last_name) {
          expenseData[`users__${index}__last_name`] = user.last_name;
        }
        if (user.email) {
          expenseData[`users__${index}__email`] = user.email;
        }
        expenseData[`users__${index}__paid_share`] = user.paid_share;
        expenseData[`users__${index}__owed_share`] = user.owed_share;
      });
    }

    const result = await splitwiseApi.createExpense(context.auth.secret_text, expenseData);
    return result;
  },
});
