import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.accounting.sage.com/v3.1';

async function apiCall<T>({
  accessToken,
  method,
  path,
  body,
  query,
}: {
  accessToken: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(query ? { queryParams: query } : {}),
    body,
  });
  return response.body;
}

async function list<T>({
  accessToken,
  path,
  query,
}: {
  accessToken: string;
  path: string;
  query?: Record<string, string>;
}): Promise<{ items: T[]; total: number }> {
  const response = await apiCall<{ $items: T[]; $total: number }>({
    accessToken,
    method: HttpMethod.GET,
    path,
    query: { attributes: 'all', ...query },
  });
  return { items: response.$items, total: response.$total };
}

async function listAll<T>({
  accessToken,
  path,
  query,
}: {
  accessToken: string;
  path: string;
  query?: Record<string, string>;
}): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  for (;;) {
    const response = await apiCall<{ $items: T[]; $next: string | null }>({
      accessToken,
      method: HttpMethod.GET,
      path,
      query: { attributes: 'all', items_per_page: '200', ...query, page: String(page) },
    });
    items.push(...response.$items);
    if (!response.$next) {
      break;
    }
    page += 1;
  }
  return items;
}

function toDate(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

export const sageAccountingClient = {
  apiCall,
  list,
  listAll,
  toDate,
  paths: {
    contacts: '/contacts',
    salesInvoices: '/sales_invoices',
    purchaseInvoices: '/purchase_invoices',
    contactPayments: '/contact_payments',
    otherPayments: '/other_payments',
    products: '/products',
    services: '/services',
    stockItems: '/stock_items',
    salesQuotes: '/sales_quotes',
    ledgerAccounts: '/ledger_accounts',
    bankAccounts: '/bank_accounts',
    paymentMethods: '/payment_methods',
    transactionTypes: '/transaction_types',
    taxRates: '/tax_rates',
    countries: '/countries',
    countryGroups: '/country_groups',
    productSalesPriceTypes: '/product_sales_price_types',
    artefactStatuses: '/artefact_statuses',
    addressTypes: '/address_types',
  },
  contactTypes: {
    customer: 'CUSTOMER',
    vendor: 'VENDOR',
  },
  transactionTypes: {
    otherPayment: 'OTHER_PAYMENT',
    otherReceipt: 'OTHER_RECEIPT',
  },
};

export type SageAccountingRef = {
  id: string;
  displayed_as: string;
};
