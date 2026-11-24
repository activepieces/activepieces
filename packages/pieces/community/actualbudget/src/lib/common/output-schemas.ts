import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const subtransactionFields: Fields = [
  { key: 'id', label: 'Split ID' },
  { key: 'amount', label: 'Amount (cents)', format: 'number' },
  { key: 'amount_decimal', label: 'Amount', format: 'number' },
  { key: 'category', label: 'Category ID' },
  { key: 'category_name', label: 'Category' },
  { key: 'payee', label: 'Payee ID' },
  { key: 'payee_name', label: 'Payee' },
  { key: 'notes', label: 'Notes' },
];

export const transactionFields: Fields = [
  { key: 'id', label: 'Transaction ID' },
  { key: 'date', label: 'Date', format: 'date' },
  {
    key: 'amount',
    label: 'Amount (cents)',
    format: 'number',
    description: 'Integer minor units; negative = money out.',
  },
  {
    key: 'amount_decimal',
    label: 'Amount',
    format: 'number',
    description: 'Amount in currency units, e.g. -12.5.',
  },
  { key: 'account', label: 'Account ID' },
  { key: 'account_name', label: 'Account' },
  { key: 'payee', label: 'Payee ID' },
  { key: 'payee_name', label: 'Payee' },
  { key: 'imported_payee', label: 'Imported Payee' },
  { key: 'category', label: 'Category ID' },
  { key: 'category_name', label: 'Category' },
  { key: 'notes', label: 'Notes' },
  { key: 'imported_id', label: 'Imported ID' },
  { key: 'transfer_id', label: 'Transfer Transaction ID' },
  { key: 'cleared', label: 'Cleared', format: 'boolean' },
  { key: 'reconciled', label: 'Reconciled', format: 'boolean' },
  { key: 'is_parent', label: 'Is Split', format: 'boolean' },
  {
    key: 'starting_balance_flag',
    label: 'Starting Balance',
    format: 'boolean',
  },
  {
    key: 'subtransactions',
    label: 'Splits',
    listItems: subtransactionFields,
    labelKey: 'category_name',
  },
];

const budgetCategoryFields: Fields = [
  { key: 'id', label: 'Category ID' },
  { key: 'name', label: 'Name' },
  { key: 'group_id', label: 'Group ID' },
  { key: 'is_income', label: 'Is Income', format: 'boolean' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  { key: 'budgeted', label: 'Budgeted (cents)', format: 'number' },
  { key: 'spent', label: 'Spent (cents)', format: 'number' },
  { key: 'balance', label: 'Balance (cents)', format: 'number' },
  { key: 'carryover', label: 'Rollover Overspending', format: 'boolean' },
  { key: 'received', label: 'Received (cents, income)', format: 'number' },
];

const budgetMonth: OutputSchema = {
  fields: [
    { key: 'month', label: 'Month' },
    {
      key: 'incomeAvailable',
      label: 'Income Available (cents)',
      format: 'number',
    },
    {
      key: 'lastMonthOverspent',
      label: 'Last Month Overspent (cents)',
      format: 'number',
    },
    {
      key: 'forNextMonth',
      label: 'Held For Next Month (cents)',
      format: 'number',
    },
    { key: 'totalBudgeted', label: 'Total Budgeted (cents)', format: 'number' },
    { key: 'toBudget', label: 'To Budget (cents)', format: 'number' },
    {
      key: 'fromLastMonth',
      label: 'From Last Month (cents)',
      format: 'number',
    },
    { key: 'totalIncome', label: 'Total Income (cents)', format: 'number' },
    { key: 'totalSpent', label: 'Total Spent (cents)', format: 'number' },
    { key: 'totalBalance', label: 'Total Balance (cents)', format: 'number' },
    {
      key: 'categoryGroups',
      label: 'Category Groups',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Group ID' },
        { key: 'name', label: 'Name' },
        { key: 'is_income', label: 'Is Income', format: 'boolean' },
        { key: 'hidden', label: 'Hidden', format: 'boolean' },
        { key: 'budgeted', label: 'Budgeted (cents)', format: 'number' },
        { key: 'spent', label: 'Spent (cents)', format: 'number' },
        { key: 'balance', label: 'Balance (cents)', format: 'number' },
        {
          key: 'received',
          label: 'Received (cents, income)',
          format: 'number',
        },
        {
          key: 'categories',
          label: 'Categories',
          listItems: budgetCategoryFields,
          labelKey: 'name',
        },
      ],
    },
  ],
};

const importResult: OutputSchema = {
  fields: [
    { key: 'added', label: 'Added Transaction IDs' },
    { key: 'updated', label: 'Updated Transaction IDs' },
    {
      key: 'errors',
      label: 'Errors',
      listItems: [{ key: 'message', label: 'Message' }],
      labelKey: 'message',
    },
    {
      key: 'updatedPreview',
      label: 'Matched Existing Transactions',
      description:
        'Rows Actual matched to an existing transaction (e.g. same Imported ID).',
    },
  ],
};

const addTransactionResult: OutputSchema = {
  fields: [
    {
      key: 'transaction_id',
      label: 'Transaction ID',
      description:
        'ID of the new transaction, or of the existing one when Imported ID matched.',
    },
    { key: 'created', label: 'Created', format: 'boolean' },
    {
      key: 'duplicate',
      label: 'Duplicate (matched Imported ID)',
      format: 'boolean',
    },
    { key: 'added', label: 'Added Transaction IDs' },
    { key: 'updated', label: 'Updated Transaction IDs' },
    {
      key: 'errors',
      label: 'Errors',
      listItems: [{ key: 'message', label: 'Message' }],
      labelKey: 'message',
    },
  ],
};

const accountItem: Fields = [
  { key: 'id', label: 'Account ID' },
  { key: 'name', label: 'Name' },
  { key: 'offbudget', label: 'Off Budget', format: 'boolean' },
  { key: 'closed', label: 'Closed', format: 'boolean' },
  {
    key: 'balance_current',
    label: 'Bank Balance (cents, linked accounts only)',
    format: 'number',
  },
  { key: 'account_group_id', label: 'Account Group ID' },
];

const categoryItem: Fields = [
  { key: 'id', label: 'Category ID' },
  { key: 'name', label: 'Name' },
  { key: 'group_id', label: 'Group ID' },
  { key: 'is_income', label: 'Is Income', format: 'boolean' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
];

export const actualOutputSchemas = {
  budgetMonth,
  importResult,
  addTransactionResult,
  accountsArray: {
    fields: accountItem,
    itemLabel: '{name}',
  } satisfies OutputSchema,
  categoriesArray: {
    fields: categoryItem,
    itemLabel: '{name}',
  } satisfies OutputSchema,
  listAccounts: {
    fields: [
      {
        key: 'accounts',
        label: 'Accounts',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Account ID' },
          { key: 'name', label: 'Name' },
          { key: 'offbudget', label: 'Off Budget', format: 'boolean' },
          { key: 'closed', label: 'Closed', format: 'boolean' },
          { key: 'balance', label: 'Balance (cents)', format: 'number' },
          { key: 'balance_decimal', label: 'Balance', format: 'number' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  listCategories: {
    fields: [
      {
        key: 'groups',
        label: 'Category Groups',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Group ID' },
          { key: 'name', label: 'Name' },
          { key: 'is_income', label: 'Is Income', format: 'boolean' },
          { key: 'hidden', label: 'Hidden', format: 'boolean' },
          {
            key: 'categories',
            label: 'Categories',
            labelKey: 'name',
            listItems: [
              { key: 'id', label: 'Category ID' },
              { key: 'name', label: 'Name' },
              { key: 'hidden', label: 'Hidden', format: 'boolean' },
            ],
          },
        ],
      },
    ],
  } satisfies OutputSchema,
  findPayees: {
    fields: [
      {
        key: 'payees',
        label: 'Payees',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Payee ID' },
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Default Category ID' },
          {
            key: 'transfer_acct',
            label: 'Transfer Account ID',
            description: 'Set when this payee is a transfer to that account.',
          },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  findTransactions: {
    fields: [
      {
        key: 'transactions',
        label: 'Transactions',
        listItems: transactionFields,
        labelKey: 'payee_name',
      },
      { key: 'count', label: 'Count', format: 'number' },
      {
        key: 'truncated',
        label: 'More Results Exist',
        format: 'boolean',
        description: 'True when more transactions matched than the limit.',
      },
    ],
  } satisfies OutputSchema,
  updateTransaction: {
    fields: [
      { key: 'id', label: 'Transaction ID' },
      { key: 'updated', label: 'Updated', format: 'boolean' },
      { key: 'transaction', label: 'Transaction', children: transactionFields },
    ],
  } satisfies OutputSchema,
  deleteTransaction: {
    fields: [
      { key: 'id', label: 'Transaction ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  setBudgetAmount: {
    fields: [
      { key: 'month', label: 'Month' },
      { key: 'category_id', label: 'Category ID' },
      { key: 'category_name', label: 'Category' },
      { key: 'amount', label: 'Budgeted (cents)', format: 'number' },
      { key: 'amount_decimal', label: 'Budgeted', format: 'number' },
      { key: 'balance', label: 'Category Balance (cents)', format: 'number' },
    ],
  } satisfies OutputSchema,
  runBankSync: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      {
        key: 'synced_accounts',
        label: 'Synced Accounts',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Account ID' },
          { key: 'name', label: 'Name' },
          { key: 'sync_source', label: 'Sync Source' },
        ],
      },
    ],
  } satisfies OutputSchema,
  newTransaction: { fields: transactionFields } satisfies OutputSchema,
};
