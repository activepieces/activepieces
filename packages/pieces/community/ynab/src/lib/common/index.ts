import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { ynabAuth } from '../auth';

const BASE_URL = 'https://api.ynab.com/v1';

async function apiCall<T extends HttpMessageBody>({
  token,
  method,
  path,
  body,
  queryParams,
}: YnabApiCallParams): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams,
    body,
  });
}

function toMilliunits({ amount }: { amount: number }): number {
  return Math.round(amount * 1000);
}

function isoDateDaysAgo({ days }: { days: number }): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function flattenCategories({
  categoryGroups,
}: {
  categoryGroups: YnabCategoryGroup[];
}): YnabCategory[] {
  return categoryGroups
    .filter((group) => !group.deleted && group.internal !== true)
    .flatMap((group) =>
      group.categories.map((category) => ({
        ...category,
        category_group_name: category.category_group_name ?? group.name,
      }))
    )
    .filter((category) => !category.deleted && category.internal !== true);
}

async function listAccounts({
  token,
  budgetId,
  lastKnowledge,
}: {
  token: string;
  budgetId: string;
  lastKnowledge?: number;
}): Promise<{ accounts: YnabAccount[]; serverKnowledge: number }> {
  const response = await apiCall<{
    data: { accounts: YnabAccount[]; server_knowledge: number };
  }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/accounts`,
    queryParams: isNil(lastKnowledge)
      ? undefined
      : { last_knowledge_of_server: String(lastKnowledge) },
  });
  return {
    accounts: response.body.data.accounts,
    serverKnowledge: response.body.data.server_knowledge,
  };
}

async function listCategories({
  token,
  budgetId,
  lastKnowledge,
}: {
  token: string;
  budgetId: string;
  lastKnowledge?: number;
}): Promise<{ categories: YnabCategory[]; serverKnowledge: number }> {
  const response = await apiCall<{
    data: { category_groups: YnabCategoryGroup[]; server_knowledge: number };
  }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/categories`,
    queryParams: isNil(lastKnowledge)
      ? undefined
      : { last_knowledge_of_server: String(lastKnowledge) },
  });
  return {
    categories: flattenCategories({
      categoryGroups: response.body.data.category_groups,
    }),
    serverKnowledge: response.body.data.server_knowledge,
  };
}

async function listPayees({
  token,
  budgetId,
  lastKnowledge,
}: {
  token: string;
  budgetId: string;
  lastKnowledge?: number;
}): Promise<{ payees: YnabPayee[]; serverKnowledge: number }> {
  const response = await apiCall<{
    data: { payees: YnabPayee[]; server_knowledge: number };
  }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/payees`,
    queryParams: isNil(lastKnowledge)
      ? undefined
      : { last_knowledge_of_server: String(lastKnowledge) },
  });
  return {
    payees: response.body.data.payees,
    serverKnowledge: response.body.data.server_knowledge,
  };
}

async function listTransactions({
  token,
  budgetId,
  sinceDate,
  lastKnowledge,
}: {
  token: string;
  budgetId: string;
  sinceDate?: string;
  lastKnowledge?: number;
}): Promise<{ transactions: YnabTransaction[]; serverKnowledge: number }> {
  const queryParams: Record<string, string> = {};
  if (!isNil(sinceDate)) {
    queryParams['since_date'] = sinceDate;
  }
  if (!isNil(lastKnowledge)) {
    queryParams['last_knowledge_of_server'] = String(lastKnowledge);
  }
  const response = await apiCall<{
    data: { transactions: YnabTransaction[]; server_knowledge: number };
  }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/transactions`,
    queryParams,
  });
  return {
    transactions: response.body.data.transactions,
    serverKnowledge: response.body.data.server_knowledge,
  };
}

async function listAccountTransactions({
  token,
  budgetId,
  accountId,
  sinceDate,
}: {
  token: string;
  budgetId: string;
  accountId: string;
  sinceDate: string;
}): Promise<YnabTransaction[]> {
  const response = await apiCall<{
    data: { transactions: YnabTransaction[] };
  }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/accounts/${accountId}/transactions`,
    queryParams: { since_date: sinceDate },
  });
  return response.body.data.transactions;
}

async function listCategoryTransactions({
  token,
  budgetId,
  categoryId,
  sinceDate,
}: {
  token: string;
  budgetId: string;
  categoryId: string;
  sinceDate: string;
}): Promise<YnabTransaction[]> {
  const response = await apiCall<{
    data: { transactions: YnabTransaction[] };
  }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/categories/${categoryId}/transactions`,
    queryParams: { since_date: sinceDate },
  });
  return response.body.data.transactions;
}

async function listScheduledTransactions({
  token,
  budgetId,
  lastKnowledge,
}: {
  token: string;
  budgetId: string;
  lastKnowledge?: number;
}): Promise<{
  scheduledTransactions: YnabScheduledTransaction[];
  serverKnowledge: number;
}> {
  const response = await apiCall<{
    data: {
      scheduled_transactions: YnabScheduledTransaction[];
      server_knowledge: number;
    };
  }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/scheduled_transactions`,
    queryParams: isNil(lastKnowledge)
      ? undefined
      : { last_knowledge_of_server: String(lastKnowledge) },
  });
  return {
    scheduledTransactions: response.body.data.scheduled_transactions,
    serverKnowledge: response.body.data.server_knowledge,
  };
}

async function getCategory({
  token,
  budgetId,
  categoryId,
}: {
  token: string;
  budgetId: string;
  categoryId: string;
}): Promise<YnabCategory> {
  const response = await apiCall<{ data: { category: YnabCategory } }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/categories/${categoryId}`,
  });
  return response.body.data.category;
}

async function getAccount({
  token,
  budgetId,
  accountId,
}: {
  token: string;
  budgetId: string;
  accountId: string;
}): Promise<YnabAccount> {
  const response = await apiCall<{ data: { account: YnabAccount } }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/accounts/${accountId}`,
  });
  return response.body.data.account;
}

async function getCurrentMonth({
  token,
  budgetId,
}: {
  token: string;
  budgetId: string;
}): Promise<YnabMonth> {
  const response = await apiCall<{ data: { month: YnabMonth } }>({
    token,
    method: HttpMethod.GET,
    path: `/budgets/${budgetId}/months/current`,
  });
  return response.body.data.month;
}

const budgetIdDropdown = Property.Dropdown({
  displayName: 'Budget',
  description: 'The YNAB budget to use.',
  auth: ynabAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your YNAB account first',
      };
    }
    const response = await apiCall<{ data: { budgets: YnabBudget[] } }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/budgets',
    });
    return {
      disabled: false,
      options: response.body.data.budgets.map((budget) => ({
        label: budget.name,
        value: budget.id,
      })),
    };
  },
});

function accountIdDropdown<R extends boolean>({
  required,
  description,
  accountTypes,
}: {
  required: R;
  description?: string;
  accountTypes?: string[];
}) {
  return Property.Dropdown({
    displayName: 'Account',
    description,
    auth: ynabAuth,
    refreshers: ['budgetId'],
    required,
    options: async ({ auth, budgetId }) => {
      if (!auth || !budgetId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a budget first',
        };
      }
      const { accounts } = await listAccounts({
        token: auth.secret_text,
        budgetId: `${budgetId}`,
      });
      const filtered = accounts.filter(
        (account) =>
          !account.deleted &&
          !account.closed &&
          (isNil(accountTypes) || accountTypes.includes(account.type))
      );
      return {
        disabled: false,
        options: filtered.map((account) => ({
          label: account.name,
          value: account.id,
        })),
      };
    },
  });
}

function categoryIdDropdown<R extends boolean>({
  required,
  description,
}: {
  required: R;
  description?: string;
}) {
  return Property.Dropdown({
    displayName: 'Category',
    description,
    auth: ynabAuth,
    refreshers: ['budgetId'],
    required,
    options: async ({ auth, budgetId }) => {
      if (!auth || !budgetId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a budget first',
        };
      }
      const { categories } = await listCategories({
        token: auth.secret_text,
        budgetId: `${budgetId}`,
      });
      return {
        disabled: false,
        options: categories
          .filter((category) => !category.hidden)
          .map((category) => ({
            label: `${category.category_group_name}: ${category.name}`,
            value: category.id,
          })),
      };
    },
  });
}

const payeeIdDropdown = Property.Dropdown({
  displayName: 'Payee',
  description:
    'The payee for the transaction. Leave empty and use "Payee Name" instead to create a new payee.',
  auth: ynabAuth,
  refreshers: ['budgetId'],
  required: false,
  options: async ({ auth, budgetId }) => {
    if (!auth || !budgetId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a budget first',
      };
    }
    const { payees } = await listPayees({
      token: auth.secret_text,
      budgetId: `${budgetId}`,
    });
    return {
      disabled: false,
      options: payees
        .filter((payee) => !payee.deleted)
        .map((payee) => ({
          label: payee.name,
          value: payee.id,
        })),
    };
  },
});

export const ynabCommon = {
  apiCall,
  toMilliunits,
  isoDateDaysAgo,
  flattenCategories,
  listAccounts,
  listCategories,
  listPayees,
  listTransactions,
  listAccountTransactions,
  listCategoryTransactions,
  listScheduledTransactions,
  getCategory,
  getAccount,
  getCurrentMonth,
  budgetIdDropdown,
  accountIdDropdown,
  categoryIdDropdown,
  payeeIdDropdown,
};

export const YNAB_BASE_URL = BASE_URL;

type YnabApiCallParams = {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
};

export type YnabBudget = {
  id: string;
  name: string;
  last_modified_on: string;
};

export type YnabAccount = {
  id: string;
  name: string;
  type: string;
  on_budget: boolean;
  closed: boolean;
  note: string | null;
  balance: number;
  cleared_balance: number;
  uncleared_balance: number;
  transfer_payee_id: string | null;
  deleted: boolean;
};

export type YnabCategory = {
  id: string;
  category_group_id: string;
  category_group_name?: string;
  name: string;
  hidden: boolean;
  internal?: boolean;
  note: string | null;
  budgeted: number;
  activity: number;
  balance: number;
  goal_type: string | null;
  goal_target: number | null;
  goal_target_month: string | null;
  goal_percentage_complete: number | null;
  deleted: boolean;
};

export type YnabCategoryGroup = {
  id: string;
  name: string;
  hidden: boolean;
  internal?: boolean;
  deleted: boolean;
  categories: YnabCategory[];
};

export type YnabPayee = {
  id: string;
  name: string;
  transfer_account_id: string | null;
  deleted: boolean;
};

export type YnabSubTransaction = {
  id: string;
  transaction_id: string;
  amount: number;
  memo: string | null;
  payee_id: string | null;
  payee_name?: string | null;
  category_id: string | null;
  category_name?: string | null;
  transfer_account_id: string | null;
  deleted: boolean;
};

export type YnabTransaction = {
  id: string;
  date: string;
  amount: number;
  memo: string | null;
  cleared: string;
  approved: boolean;
  flag_color: string | null;
  account_id: string;
  account_name?: string;
  payee_id: string | null;
  payee_name?: string | null;
  category_id: string | null;
  category_name?: string | null;
  transfer_account_id: string | null;
  deleted: boolean;
  subtransactions?: YnabSubTransaction[];
};

export type YnabScheduledTransaction = {
  id: string;
  date_first: string;
  date_next: string;
  frequency: string;
  amount: number;
  memo: string | null;
  flag_color: string | null;
  account_id: string;
  account_name?: string;
  payee_id: string | null;
  payee_name?: string | null;
  category_id: string | null;
  category_name?: string | null;
  transfer_account_id: string | null;
  deleted: boolean;
};

export type YnabMonth = {
  month: string;
  note: string | null;
  income: number;
  budgeted: number;
  activity: number;
  to_be_budgeted: number;
  age_of_money: number | null;
  deleted: boolean;
  categories: YnabCategory[];
};
