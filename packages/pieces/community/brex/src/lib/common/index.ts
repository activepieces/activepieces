import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { brexAuth } from '../../';

async function brexApiCall<T extends HttpMessageBody>({
  token,
  method,
  path,
  body,
  queryParams,
  idempotencyKey,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  idempotencyKey?: string;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${BREX_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams,
    body,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

function getToken(auth: unknown): string {
  return (auth as { secret_text: string }).secret_text;
}

function toMajorUnits(money: BrexMoney | null | undefined): number | null {
  if (!money || typeof money.amount !== 'number') {
    return null;
  }
  return money.amount / 100;
}

function flattenUser(user: BrexUser) {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    status: user.status ?? null,
    manager_id: user.manager_id ?? null,
    department_id: user.department_id ?? null,
    location_id: user.location_id ?? null,
    title_id: user.title_id ?? null,
    remote_display_id: user.remote_display_id ?? null,
  };
}

function flattenCard(card: BrexCard) {
  return {
    id: card.id,
    card_name: card.card_name ?? null,
    last_four: card.last_four ?? null,
    status: card.status ?? null,
    owner_user_id: card.owner_user_id ?? null,
    limit_type: card.limit_type ?? null,
    card_type: card.card_type ?? null,
  };
}

function flattenCashAccount(account: BrexCashAccount) {
  return {
    id: account.id,
    name: account.name,
    status: account.status ?? null,
    account_number: account.account_number ?? null,
    routing_number: account.routing_number ?? null,
    current_balance: toMajorUnits(account.current_balance),
    current_balance_currency: account.current_balance?.currency ?? null,
    available_balance: toMajorUnits(account.available_balance),
    available_balance_currency: account.available_balance?.currency ?? null,
  };
}

function flattenVendor(vendor: BrexVendor) {
  return {
    id: vendor.id,
    company_name: vendor.company_name,
    email: vendor.email ?? null,
    phone: vendor.phone ?? null,
    payment_account_id: vendor.payment_accounts?.[0]?.id ?? null,
    payment_account_count: vendor.payment_accounts?.length ?? 0,
  };
}

function flattenExpense(expense: BrexExpense) {
  return {
    id: expense.id,
    memo: expense.memo ?? null,
    status: expense.status ?? null,
    expense_type: expense.expense_type ?? null,
    payment_status: expense.payment_status ?? null,
    category: expense.category ?? null,
    user_id: expense.user_id ?? null,
    merchant_id: expense.merchant_id ?? null,
    merchant_name: expense.merchant?.raw_descriptor ?? null,
    department_id: expense.department_id ?? null,
    location_id: expense.location_id ?? null,
    budget_id: expense.budget_id ?? null,
    purchased_at: expense.purchased_at ?? null,
    updated_at: expense.updated_at ?? null,
    original_amount: toMajorUnits(expense.original_amount),
    original_amount_currency: expense.original_amount?.currency ?? null,
    billing_amount: toMajorUnits(expense.billing_amount),
    billing_amount_currency: expense.billing_amount?.currency ?? null,
    usd_equivalent_amount: toMajorUnits(expense.usd_equivalent_amount),
    dashboard_url: expense.dashboard_url ?? null,
  };
}

function flattenCardTransaction(transaction: BrexCardTransaction) {
  return {
    id: transaction.id,
    card_id: transaction.card_id ?? null,
    description: transaction.description ?? null,
    type: transaction.type ?? null,
    amount: toMajorUnits(transaction.amount),
    amount_currency: transaction.amount?.currency ?? null,
    merchant_name: transaction.merchant?.raw_descriptor ?? null,
    merchant_mcc: transaction.merchant?.mcc ?? null,
    merchant_country: transaction.merchant?.country ?? null,
    initiated_at_date: transaction.initiated_at_date ?? null,
    posted_at_date: transaction.posted_at_date ?? null,
  };
}

function flattenTransfer(transfer: BrexTransfer) {
  return {
    id: transfer.id,
    description: transfer.description ?? null,
    external_memo: transfer.external_memo ?? null,
    display_name: transfer.display_name ?? null,
    payment_type: transfer.payment_type ?? null,
    status: transfer.status ?? null,
    amount: toMajorUnits(transfer.amount),
    amount_currency: transfer.amount?.currency ?? null,
    counterparty_payment_instrument_id:
      transfer.counterparty?.payment_instrument_id ?? null,
    originating_account_id: transfer.originating_account?.id ?? null,
    creator_user_id: transfer.creator_user_id ?? null,
    created_at: transfer.created_at ?? null,
    process_date: transfer.process_date ?? null,
    estimated_delivery_date: transfer.estimated_delivery_date ?? null,
  };
}

function flattenBudget(budget: BrexBudget) {
  return {
    id: budget.id,
    name: budget.name ?? null,
    description: budget.description ?? null,
    status: budget.status ?? null,
    parent_budget_id: budget.parent_budget_id ?? null,
    period_type: budget.period_type ?? null,
    limit: toMajorUnits(budget.limit),
    limit_currency: budget.limit?.currency ?? null,
  };
}

const userDropdown = Property.Dropdown({
  displayName: 'User',
  description: 'Select a Brex user.',
  auth: brexAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Brex account first',
      };
    }
    try {
      const response = await brexApiCall<{ items: BrexUser[] }>({
        token: getToken(auth),
        method: HttpMethod.GET,
        path: '/v2/users',
        queryParams: { limit: '100' },
      });
      return {
        disabled: false,
        options: response.body.items.map((user) => ({
          label: `${user.first_name} ${user.last_name} (${user.email})`,
          value: user.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load users. Check your connection.',
      };
    }
  },
});

const cardDropdown = Property.Dropdown({
  displayName: 'Card',
  description: 'Select a Brex card.',
  auth: brexAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Brex account first',
      };
    }
    try {
      const response = await brexApiCall<{ items: BrexCard[] }>({
        token: getToken(auth),
        method: HttpMethod.GET,
        path: '/v2/cards',
        queryParams: { limit: '100' },
      });
      return {
        disabled: false,
        options: response.body.items.map((card) => ({
          label: card.last_four
            ? `${card.card_name ?? 'Card'} (••${card.last_four})`
            : card.card_name ?? card.id,
          value: card.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load cards. Check your connection.',
      };
    }
  },
});

const cashAccountDropdown = Property.Dropdown({
  displayName: 'Originating Cash Account',
  description: 'The Brex Cash account the money is sent from.',
  auth: brexAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Brex account first',
      };
    }
    try {
      const response = await brexApiCall<{ items: BrexCashAccount[] }>({
        token: getToken(auth),
        method: HttpMethod.GET,
        path: '/v2/accounts/cash',
      });
      return {
        disabled: false,
        options: response.body.items.map((account) => ({
          label: `${account.name}${account.status ? ` (${account.status})` : ''}`,
          value: account.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load cash accounts. Check your connection.',
      };
    }
  },
});

const vendorPaymentInstrumentDropdown = Property.Dropdown({
  displayName: 'Vendor',
  description:
    'The vendor to pay. Only vendors that already have payment (bank) details set up are shown. Add a vendor with the "Create Vendor" action or in the Brex dashboard.',
  auth: brexAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Brex account first',
      };
    }
    try {
      const response = await brexApiCall<{ items: BrexVendor[] }>({
        token: getToken(auth),
        method: HttpMethod.GET,
        path: '/v1/vendors',
        queryParams: { limit: '100' },
      });
      const options = response.body.items
        .filter((vendor) => (vendor.payment_accounts?.length ?? 0) > 0)
        .map((vendor) => ({
          label: vendor.company_name,
          value: vendor.payment_accounts[0].id,
        }));
      return {
        disabled: false,
        options,
        placeholder: options.length
          ? undefined
          : 'No vendors with payment details found. Create one first.',
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load vendors. Check your connection.',
      };
    }
  },
});

export const BREX_BASE_URL = 'https://platform.brexapis.com';

export const brexCommon = {
  apiCall: brexApiCall,
  getToken,
  toMajorUnits,
  flattenUser,
  flattenCard,
  flattenCashAccount,
  flattenVendor,
  flattenExpense,
  flattenCardTransaction,
  flattenTransfer,
  flattenBudget,
  userDropdown,
  cardDropdown,
  cashAccountDropdown,
  vendorPaymentInstrumentDropdown,
};

export type BrexMoney = {
  amount: number;
  currency: string;
};

export type BrexUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status?: string;
  manager_id?: string | null;
  department_id?: string | null;
  location_id?: string | null;
  title_id?: string | null;
  remote_display_id?: string | null;
};

export type BrexCard = {
  id: string;
  card_name?: string;
  last_four?: string;
  status?: string;
  owner_user_id?: string;
  limit_type?: string;
  card_type?: string;
};

export type BrexCashAccount = {
  id: string;
  name: string;
  status?: string;
  account_number?: string | null;
  routing_number?: string | null;
  current_balance?: BrexMoney | null;
  available_balance?: BrexMoney | null;
};

export type BrexVendorPaymentAccount = {
  id: string;
  type?: string;
};

export type BrexVendor = {
  id: string;
  company_name: string;
  email?: string | null;
  phone?: string | null;
  payment_accounts: BrexVendorPaymentAccount[];
};

export type BrexExpense = {
  id: string;
  memo?: string | null;
  status?: string;
  expense_type?: string;
  payment_status?: string;
  category?: string | null;
  user_id?: string | null;
  merchant_id?: string | null;
  department_id?: string | null;
  location_id?: string | null;
  budget_id?: string | null;
  purchased_at?: string | null;
  updated_at?: string | null;
  dashboard_url?: string | null;
  original_amount?: BrexMoney | null;
  billing_amount?: BrexMoney | null;
  usd_equivalent_amount?: BrexMoney | null;
  merchant?: { raw_descriptor?: string; mcc?: string; country?: string } | null;
};

export type BrexCardTransaction = {
  id: string;
  card_id?: string | null;
  description?: string;
  type?: string;
  initiated_at_date?: string;
  posted_at_date?: string;
  amount?: BrexMoney | null;
  merchant?: { raw_descriptor?: string; mcc?: string; country?: string } | null;
};

export type BrexTransfer = {
  id: string;
  description?: string;
  external_memo?: string;
  display_name?: string;
  payment_type?: string;
  status?: string;
  created_at?: string;
  process_date?: string | null;
  estimated_delivery_date?: string | null;
  creator_user_id?: string | null;
  amount?: BrexMoney | null;
  counterparty?: { type?: string; payment_instrument_id?: string } | null;
  originating_account?: { type?: string; id?: string } | null;
};

export type BrexBudget = {
  id: string;
  name?: string;
  description?: string | null;
  status?: string;
  parent_budget_id?: string | null;
  limit?: BrexMoney | null;
  period_type?: string;
};
