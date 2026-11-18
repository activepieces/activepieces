import { Property } from '@activepieces/pieces-framework';
import { InvoiceNinjaAuthValue, invoiceNinjaClient } from './client';
import { invoiceNinjaProps } from './props';

const MAX_ITEMS = 100;

function parseOrderItems(json: unknown): { product_key: string; quantity: number; discount: number }[] {
  const text = typeof json === 'string' ? json.trim() : '';
  let parsed: unknown;
  try {
    parsed = text === '' ? null : JSON.parse(text);
  } catch {
    throw new Error('Order Items JSON is not valid JSON. Example: [{"quantity":1,"product_key":"my-product","discount":"0"}]');
  }
  const list = Array.isArray(json) ? json : parsed;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('Order Items JSON must be a non-empty array of items.');
  }
  if (list.length > MAX_ITEMS) {
    throw new Error(`Order Items JSON can hold at most ${MAX_ITEMS} items.`);
  }
  return list.map((item, index) => {
    const row = `Order item ${index + 1}`;
    if (!invoiceNinjaClient.isRecord(item)) throw new Error(`${row} must be an object.`);
    const productKey = invoiceNinjaClient.optionalText(item['product_key']);
    if (productKey === undefined) throw new Error(`${row} needs a product_key.`);
    const quantity = invoiceNinjaClient.optionalNumber({ value: item['quantity'], label: `${row} quantity` });
    if (quantity === undefined) throw new Error(`${row} needs a numeric quantity.`);
    const discount = invoiceNinjaClient.optionalNumber({ value: item['discount'], label: `${row} discount`, min: 0 }) ?? 0;
    return { product_key: productKey, quantity, discount };
  });
}

async function lineItemsFromProducts({ auth, json, isAmountDiscount }: LineItemsInput): Promise<Record<string, unknown>[]> {
  const items = parseOrderItems(json);
  const keys = [...new Set(items.map((item) => item.product_key))];
  const products = new Map<string, Record<string, unknown>>();
  for (const key of keys) {
    const result = await invoiceNinjaClient.listPage({ auth, entity: 'products', query: { product_key: key }, page: 1, perPage: 100 });
    const match = result.items.filter(invoiceNinjaClient.isRecord).find((product) => product['product_key'] === key);
    if (match) products.set(key, match);
  }
  const missing = keys.filter((key) => !products.has(key));
  if (missing.length > 0) {
    throw new Error(`No active product with product key: ${missing.join(', ')}.`);
  }
  return items.map((item) => {
    const product = products.get(item.product_key) ?? {};
    return {
      quantity: item.quantity,
      product_key: item.product_key,
      product_cost: product['price'],
      cost: product['price'],
      notes: product['notes'],
      discount: item.discount,
      is_amount_discount: isAmountDiscount,
      tax_name1: product['tax_name1'],
      tax_rate1: product['tax_rate1'],
      tax_id: product['tax_id'],
    };
  });
}

function legacyProps() {
  return {
    client_id: invoiceNinjaProps.clientDropdown({ required: true }),
    purchase_order_no: Property.ShortText({
      displayName: 'Purchase Order Number',
      description: 'Descriptive text or number (optional).',
      required: false,
    }),
    discount: Property.Number({
      displayName: 'Invoice Discount',
      description: 'Discount for the whole invoice. 0 = none.',
      defaultValue: 0,
      required: true,
    }),
    discount_type: Property.StaticDropdown({
      displayName: 'Type of discount',
      description: 'Amount or percentage. Applies to line items and invoice.',
      defaultValue: true,
      required: true,
      options: {
        options: [
          { label: 'Amount', value: true },
          { label: 'Percentage', value: false },
        ],
      },
    }),
    public_notes: Property.LongText({ displayName: 'Public notes', description: 'Visible in the client portal (optional).', required: false }),
    private_notes: Property.LongText({ displayName: 'Private notes', description: 'Not visible to the client (optional).', required: false }),
    order_items_json: Property.LongText({
      displayName: 'Order Items JSON',
      description: 'Each item references an existing product key; price, description and tax come from the product. e.g. [{ "quantity":1,"product_key":"product key", "discount": "0" }]',
      required: true,
    }),
  };
}

export const invoiceNinjaLegacy = { parseOrderItems, lineItemsFromProducts, legacyProps };

type LineItemsInput = {
  auth: InvoiceNinjaAuthValue;
  json: unknown;
  isAmountDiscount: boolean;
};
