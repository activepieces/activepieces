import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { wafeqApiCall, WafeqPaginatedResponse } from './client';
import { wafeqAuth } from './auth';

export const wafeqProps = {
  contactDropdown: (params?: {
    displayName?: string;
    required?: boolean;
    description?: string;
  }) =>
    Property.Dropdown({
      auth: wafeqAuth,
      displayName: params?.displayName ?? 'Contact',
      description:
        params?.description ??
        'Pick a contact (customer or supplier). If you don\'t see a contact, use the "Create Contact" action first.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wafeq account first',
          };
        }
        try {
          const response = await wafeqApiCall<
            WafeqPaginatedResponse<ContactListItem>
          >({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            path: '/contacts/',
            queryParams: { page_size: '200' },
          });
          if (response.body.results.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No contacts found. Create one in Wafeq first.',
            };
          }
          return {
            disabled: false,
            options: response.body.results.map((c) => ({
              label: c.email ? `${c.name} (${c.email})` : c.name,
              value: c.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load contacts. Check your API key.',
          };
        }
      },
    }),

  itemDropdown: (params?: {
    displayName?: string;
    required?: boolean;
    description?: string;
  }) =>
    Property.Dropdown({
      auth: wafeqAuth,
      displayName: params?.displayName ?? 'Item',
      description:
        params?.description ??
        'Pick a product or service from your Wafeq item catalog. Leave empty for ad-hoc line items.',
      required: params?.required ?? false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wafeq account first',
          };
        }
        try {
          const response = await wafeqApiCall<
            WafeqPaginatedResponse<ItemListItem>
          >({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            path: '/items/',
            queryParams: { page_size: '200' },
          });
          if (response.body.results.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No items found. Create one in Wafeq first.',
            };
          }
          return {
            disabled: false,
            options: response.body.results.map((i) => ({
              label: i.sku ? `${i.name} (${i.sku})` : i.name,
              value: i.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load items',
          };
        }
      },
    }),

  invoiceDropdown: (params?: {
    displayName?: string;
    required?: boolean;
    description?: string;
  }) =>
    Property.Dropdown({
      auth: wafeqAuth,
      displayName: params?.displayName ?? 'Invoice',
      description:
        params?.description ??
        'Pick an invoice. Only the 100 most recent invoices are shown — use "Create Invoice" first if you need a specific invoice.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wafeq account first',
          };
        }
        try {
          const response = await wafeqApiCall<
            WafeqPaginatedResponse<InvoiceListItem>
          >({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            path: '/invoices/',
            queryParams: { page_size: '100' },
          });
          if (response.body.results.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No invoices found yet',
            };
          }
          return {
            disabled: false,
            options: response.body.results.map((inv) => ({
              label: `#${inv.invoice_number} — ${inv.currency} ${inv.amount}`,
              value: inv.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load invoices',
          };
        }
      },
    }),

  quoteDropdown: (params?: {
    displayName?: string;
    required?: boolean;
    description?: string;
  }) =>
    Property.Dropdown({
      auth: wafeqAuth,
      displayName: params?.displayName ?? 'Quote',
      description:
        params?.description ??
        'Pick a quote to work with. Only the 100 most recent quotes are listed.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wafeq account first',
          };
        }
        try {
          const response = await wafeqApiCall<
            WafeqPaginatedResponse<QuoteListItem>
          >({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            path: '/quotes/',
            queryParams: { page_size: '100' },
          });
          if (response.body.results.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No quotes found yet',
            };
          }
          return {
            disabled: false,
            options: response.body.results.map((q) => ({
              label: `#${q.quote_number} — ${q.currency} ${q.amount}`,
              value: q.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load quotes',
          };
        }
      },
    }),

  accountDropdown: (params?: {
    displayName?: string;
    description?: string;
    required?: boolean;
    paymentEnabledOnly?: boolean;
    classification?: AccountClassification;
  }) =>
    Property.Dropdown({
      auth: wafeqAuth,
      displayName: params?.displayName ?? 'Account',
      description:
        params?.description ??
        'The general-ledger account this line maps to. You can see the full chart of accounts in Wafeq under Accounting > Chart of Accounts.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wafeq account first',
          };
        }
        try {
          const queryParams: Record<string, string> = { page_size: '200' };
          if (params?.classification) {
            queryParams['classification'] = params.classification;
          }
          if (params?.paymentEnabledOnly) {
            queryParams['is_payment_enabled'] = 'true';
          }
          const response = await wafeqApiCall<
            WafeqPaginatedResponse<AccountListItem>
          >({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            path: '/accounts/',
            queryParams,
          });
          return {
            disabled: false,
            options: response.body.results.map((a) => ({
              label: `${a.account_code ? a.account_code + ' — ' : ''}${
                a.name_en ?? a.name_ar ?? a.id
              }`,
              value: a.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load accounts',
          };
        }
      },
    }),

  taxRateDropdown: (params?: {
    displayName?: string;
    required?: boolean;
    description?: string;
  }) =>
    Property.Dropdown({
      auth: wafeqAuth,
      displayName: params?.displayName ?? 'Tax Rate',
      description:
        params?.description ??
        'Optional. Pick the tax rate to apply. Leave empty to use the item default or no tax.',
      required: params?.required ?? false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wafeq account first',
          };
        }
        try {
          const response = await wafeqApiCall<
            WafeqPaginatedResponse<TaxRateListItem>
          >({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            path: '/tax-rates/',
            queryParams: { page_size: '200' },
          });
          return {
            disabled: false,
            options: response.body.results.map((t) => ({
              label: t.rate != null ? `${t.name} (${t.rate}%)` : t.name,
              value: t.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load tax rates',
          };
        }
      },
    }),

  currency: (params?: { required?: boolean; defaultValue?: string }) =>
    Property.StaticDropdown({
      displayName: 'Currency',
      description:
        'Which currency the amounts below are in. Pick AED for UAE, SAR for Saudi Arabia, or any other currency you invoice in.',
      required: params?.required ?? true,
      defaultValue: params?.defaultValue,
      options: {
        disabled: false,
        options: COMMON_CURRENCIES.map((c) => ({
          label: `${c.code} — ${c.name}`,
          value: c.code,
        })),
      },
    }),

  lineItemsArray: Property.Array({
    displayName: 'Line Items',
    description:
      'Add one row for each product or service on the document. Each row needs at least a description, quantity, and unit price. Leave the account and tax fields blank to use the defaults you set above.',
    required: true,
    properties: {
      description: Property.ShortText({
        displayName: 'Description',
        description:
          'What this line is for (e.g. "Consulting — April", "Office chair"). This is printed on the document.',
        required: true,
      }),
      quantity: Property.Number({
        displayName: 'Quantity',
        description: 'How many units. Use 1 if unsure.',
        required: true,
        defaultValue: 1,
      }),
      unit_amount: Property.Number({
        displayName: 'Unit Price',
        description: 'Price per single unit, in the currency you chose above (before tax).',
        required: true,
      }),
      item: Property.ShortText({
        displayName: 'Item ID (optional)',
        description:
          'Optional. Paste a Wafeq item ID here to link this line to a product in your catalog. You can get item IDs from the "List Items" action. Leave blank to just use the description and price.',
        required: false,
      }),
      account: Property.ShortText({
        displayName: 'Account ID (optional)',
        description:
          'Optional. Paste an account ID to override the default account you chose above — e.g. book this one line to a different sales account. Leave blank to use the default.',
        required: false,
      }),
      tax_rate: Property.ShortText({
        displayName: 'Tax Rate ID (optional)',
        description:
          'Optional. Paste a tax rate ID to override the default tax rate for this line only. Leave blank to use the default or no tax.',
        required: false,
      }),
      discount: Property.Number({
        displayName: 'Discount %',
        description:
          'Optional per-line discount, as a percentage (e.g. 10 for 10% off).',
        required: false,
      }),
    },
  }),

  idempotencyKey: Property.ShortText({
    displayName: 'Duplicate Protection Key',
    description:
      'Advanced. If the flow retries this step, sending the same key prevents creating a duplicate. Most users can leave this blank.',
    required: false,
  }),

  externalId: (displayName = 'Your Reference ID') =>
    Property.ShortText({
      displayName,
      description:
        'Optional. Store an ID from another system here (e.g. the order number from your online store) so you can find this record in Wafeq later.',
      required: false,
    }),
};

export const COMMON_CURRENCIES: ReadonlyArray<{ code: string; name: string }> =
  [
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'QAR', name: 'Qatari Riyal' },
    { code: 'KWD', name: 'Kuwaiti Dinar' },
    { code: 'BHD', name: 'Bahraini Dinar' },
    { code: 'OMR', name: 'Omani Rial' },
    { code: 'JOD', name: 'Jordanian Dinar' },
    { code: 'EGP', name: 'Egyptian Pound' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
  ];

export type LineItemInput = {
  item?: string;
  description: string;
  quantity: number;
  unit_amount: number;
  account: string;
  tax_rate?: string;
  discount?: number;
};

export type ContactListItem = {
  id: string;
  name: string;
  email?: string | null;
};

export type ItemListItem = {
  id: string;
  name: string;
  sku?: string | null;
};

export type InvoiceListItem = {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
};

export type QuoteListItem = {
  id: string;
  quote_number: string;
  amount: number;
  currency: string;
};

export type AccountListItem = {
  id: string;
  account_code?: string | null;
  name_en?: string | null;
  name_ar?: string | null;
};

export type TaxRateListItem = {
  id: string;
  name: string;
  rate?: number | null;
};

export type AccountClassification =
  | 'REVENUE'
  | 'EXPENSE'
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY';
