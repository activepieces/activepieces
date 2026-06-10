import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { qawafelAuth } from './auth';
import { qawafelApiCall, QawafelPaginatedResponse } from './client';

export const qawafelProps = {
  merchantDropdown: (params?: {
    displayName?: string;
    description?: string;
    required?: boolean;
    type?: 'customer' | 'supplier';
  }) =>
    Property.Dropdown({
      auth: qawafelAuth,
      displayName: params?.displayName ?? 'Merchant',
      description:
        params?.description ??
        'Pick a merchant. If you don\'t see who you need, use the "Create Merchant" action first.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your Qawafel account first',
          };
        }
        try {
          const queryParams: Record<string, string> = { limit: '100' };
          if (params?.type) queryParams['type'] = params.type;
          const response = await qawafelApiCall<
            QawafelPaginatedResponse<MerchantListItem>
          >({
            auth,
            method: HttpMethod.GET,
            path: '/merchants',
            queryParams,
          });
          if (response.body.data.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No merchants found yet — create one first.',
            };
          }
          return {
            disabled: false,
            options: response.body.data.map((m) => ({
              label: formatMerchantLabel(m),
              value: m.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Could not load merchants. Check your API key.',
          };
        }
      },
    }),

  productDropdown: (params?: {
    displayName?: string;
    description?: string;
    required?: boolean;
    type?: 'sale' | 'purchase';
  }) =>
    Property.Dropdown({
      auth: qawafelAuth,
      displayName: params?.displayName ?? 'Product',
      description:
        params?.description ??
        'Pick a product from your Qawafel catalog. Only the 100 most recent products are shown — use "Create Product" first if needed.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your Qawafel account first',
          };
        }
        try {
          const queryParams: Record<string, string> = { limit: '100' };
          if (params?.type) queryParams['type'] = params.type;
          const response = await qawafelApiCall<
            QawafelPaginatedResponse<ProductListItem>
          >({
            auth,
            method: HttpMethod.GET,
            path: '/products',
            queryParams,
          });
          if (response.body.data.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No products found yet — create one first.',
            };
          }
          return {
            disabled: false,
            options: response.body.data.map((p) => ({
              label: formatProductLabel(p),
              value: p.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Could not load products. Check your API key.',
          };
        }
      },
    }),

  orderLineItemsArray: Property.Array({
    displayName: 'Line Items',
    description:
      'One row per product on this order. Each row needs a product, quantity, and unit price.',
    required: true,
    properties: {
      product_id: Property.ShortText({
        displayName: 'Product ID',
        description:
          'Qawafel product ID (starts with `prod_`). Must be a `sale` type product. Use the "List Products" action to find IDs.',
        required: true,
      }),
      quantity: Property.Number({
        displayName: 'Quantity',
        description: 'How many units of this product. Whole numbers only.',
        required: true,
        defaultValue: 1,
      }),
      unit_price: Property.ShortText({
        displayName: 'Unit Price (SAR)',
        description:
          'Price per single unit in Saudi Riyals. Use a decimal string with two places, e.g. `99.00` or `1234.56`.',
        required: true,
      }),
      discount_percentage: Property.ShortText({
        displayName: 'Discount %',
        description:
          'Optional. Per-line discount as a percentage, e.g. `10.00` for 10% off. Leave blank for no discount.',
        required: false,
      }),
      external_ref: Property.ShortText({
        displayName: 'Your Reference (optional)',
        description:
          'Optional. Your own ID for this line item (e.g. an order-line ID from your ERP).',
        required: false,
      }),
    },
  }),

  invoiceLineItemsArray: Property.Array({
    displayName: 'Line Items',
    description:
      'One row per product on this invoice. Each row needs a product, quantity, unit price, and VAT %.',
    required: true,
    properties: {
      product_id: Property.ShortText({
        displayName: 'Product ID',
        description:
          'Qawafel product ID (starts with `prod_`). Must be a `sale` type product.',
        required: true,
      }),
      quantity: Property.Number({
        displayName: 'Quantity',
        description: 'How many units. Whole numbers only.',
        required: true,
        defaultValue: 1,
      }),
      unit_price: Property.ShortText({
        displayName: 'Unit Price (SAR)',
        description:
          'Price per unit in Saudi Riyals as a decimal string, e.g. `99.00`.',
        required: true,
      }),
      vat_percentage: Property.ShortText({
        displayName: 'VAT %',
        description:
          'VAT rate to apply, e.g. `15.00` for the standard Saudi VAT, or `0.00` for VAT-exempt items.',
        required: true,
        defaultValue: '15.00',
      }),
      discount_percentage: Property.ShortText({
        displayName: 'Discount %',
        description:
          'Optional. Per-line discount as a percentage, e.g. `5.00` for 5% off.',
        required: false,
      }),
      external_ref: Property.ShortText({
        displayName: 'Your Reference (optional)',
        description: 'Optional. Your own ID for this line item.',
        required: false,
      }),
    },
  }),

  addressGroup: Property.Object({
    displayName: 'Address',
    description:
      'Postal address. The minimum required fields are street, city, and postal code (5 digits in Saudi Arabia). Use ISO codes for country (e.g. `SA` for Saudi Arabia).',
    required: true,
    defaultValue: {},
  }),

  idempotencyKey: Property.ShortText({
    displayName: 'Duplicate Protection Key',
    description:
      'Advanced. A UUID v4 — if the flow retries this step, sending the same key prevents creating a duplicate. Most users can leave this blank.',
    required: false,
  }),

  externalRef: (displayName = 'Your Reference ID') =>
    Property.ShortText({
      displayName,
      description:
        'Optional. Store an ID from another system here (e.g. your ERP record ID) to link records across systems. Must be unique within Qawafel.',
      required: false,
    }),
};

export const TRANSITIONS_BY_STATE: Record<string, OrderTransitionOption[]> = {
  pending_vendor_confirmation: [
    {
      label: 'Confirm — vendor accepts the order (→ Confirmed)',
      value: 'confirm',
    },
  ],
  confirmed: [
    {
      label: 'Mark Ready for Pickup (→ Ready for Pickup)',
      value: 'ready-for-pickup',
    },
  ],
  ready_for_pickup: [
    {
      label: 'Mark Out for Delivery (→ Out for Delivery)',
      value: 'out-for-delivery',
    },
  ],
  out_for_delivery: [
    { label: 'Mark Delivered (→ Delivered)', value: 'deliver' },
    {
      label: 'Mark Not Delivered — failed delivery (→ Not Delivered)',
      value: 'not-delivered',
    },
  ],
  delivered: [
    {
      label: 'Mark Fulfilled — releases the payout (→ Fulfilled)',
      value: 'fulfill',
    },
  ],
};

export const ALL_TRANSITIONS_FALLBACK: OrderTransitionOption[] = [
  {
    label: 'Confirm — only valid from Pending Vendor Confirmation',
    value: 'confirm',
  },
  {
    label: 'Mark Ready for Pickup — only valid from Confirmed',
    value: 'ready-for-pickup',
  },
  {
    label: 'Mark Out for Delivery — only valid from Ready for Pickup',
    value: 'out-for-delivery',
  },
  {
    label: 'Mark Delivered — only valid from Out for Delivery',
    value: 'deliver',
  },
  {
    label: 'Mark Not Delivered — only valid from Out for Delivery',
    value: 'not-delivered',
  },
  {
    label: 'Mark Fulfilled — only valid from Delivered',
    value: 'fulfill',
  },
];

function formatMerchantLabel(m: MerchantListItem): string {
  const name = m.name_en || m.name_ar || m.legal_name || m.id;
  const suffix = m.type ? ` (${m.type})` : '';
  return `${name}${suffix}`;
}

function formatProductLabel(p: ProductListItem): string {
  const name = p.name_en || p.name_ar || p.id;
  return p.sku ? `${name} — ${p.sku}` : name;
}

export type OrderLineItemInput = {
  product_id: string;
  quantity: number;
  unit_price: string;
  discount_percentage?: string;
  external_ref?: string;
};

export type InvoiceLineItemInput = {
  product_id: string;
  quantity: number;
  unit_price: string;
  vat_percentage: string;
  discount_percentage?: string;
  external_ref?: string;
};

export type MerchantListItem = {
  id: string;
  legal_name?: string | null;
  name_en?: string | null;
  name_ar?: string | null;
  type?: 'customer' | 'supplier';
};

export type ProductListItem = {
  id: string;
  sku?: string | null;
  name_en?: string | null;
  name_ar?: string | null;
};

type OrderTransition =
  | 'confirm'
  | 'ready-for-pickup'
  | 'out-for-delivery'
  | 'deliver'
  | 'not-delivered'
  | 'fulfill';

type OrderTransitionOption = { label: string; value: OrderTransition };
