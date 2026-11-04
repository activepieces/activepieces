import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../auth';
import { QuickzuAPIClient } from './client';

export function makeClient(auth: AppConnectionValueForAuthProperty<typeof quickzuAuth>) {
  return new QuickzuAPIClient(auth.secret_text);
}

export function toQuickzuDate(value: string): string {
  const trimmed = value.trim();
  if (DATE_ONLY.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date "${value}". Use the YYYY-MM-DD format.`);
  }
  return parsed.toISOString().slice(0, 10);
}

export function requireValue({ value, label }: { value: string | undefined; label: string }): string {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function notConnected() {
  return {
    disabled: true,
    options: [],
    placeholder: 'Please connect your account first.',
  };
}

async function fetchOrderOptions(client: QuickzuAPIClient) {
  const options: { label: string; value: string }[] = [];
  for (let page = 1; page <= ORDER_DROPDOWN_MAX_PAGES; page++) {
    const res = await client.listOrders({ page, limit: ORDER_DROPDOWN_PAGE_SIZE });
    const orders = res.data ?? [];
    options.push(
      ...orders.map((order) => ({
        label: String(order.order_id),
        value: order._id,
      }))
    );
    if (orders.length < ORDER_DROPDOWN_PAGE_SIZE) break;
  }
  return options;
}

export const quickzuCommon = {
  categoryId: (required = false) =>
    Property.Dropdown({
      auth: quickzuAuth,
      displayName: 'Category',
      refreshers: [],
      required,
      options: async ({ auth }) => {
        if (!auth) return notConnected();
        const res = await makeClient(auth).listCategories();
        return {
          disabled: false,
          options: res.data.map((category) => ({
            label: category.name,
            value: category._id,
          })),
        };
      },
    }),
  productId: (required = false) =>
    Property.Dropdown({
      auth: quickzuAuth,
      displayName: 'Product',
      refreshers: [],
      required,
      options: async ({ auth }) => {
        if (!auth) return notConnected();
        const res = await makeClient(auth).listProducts();
        return {
          disabled: false,
          options: res.data.map((product) => ({
            label: product.name,
            value: product._id,
          })),
        };
      },
    }),
  orderId: (required = false) =>
    Property.Dropdown<string, boolean, typeof quickzuAuth>({
      auth: quickzuAuth,
      displayName: 'Order',
      refreshers: [],
      required,
      options: async ({ auth }) => {
        if (!auth) return notConnected();
        return {
          disabled: false,
          options: await fetchOrderOptions(makeClient(auth)),
        };
      },
    }),
};

const ORDER_DROPDOWN_PAGE_SIZE = 100;
const ORDER_DROPDOWN_MAX_PAGES = 10;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
