import { Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from './auth';
import { JsonApiResource, listAllPages } from './client';

export async function storeOptions({ auth }: { auth: ConnectionAuth }) {
  return dropdownOptions({ auth, path: '/stores', label: (s) => String(attr({ item: s, key: 'name' }) ?? s.id) });
}

export async function orderOptions({ auth, storeId }: { auth: ConnectionAuth; storeId?: unknown }) {
  return dropdownOptions({
    auth,
    path: '/orders',
    query: { 'filter[store_id]': storeId ? String(storeId) : undefined },
    label: (o) =>
      `#${String(attr({ item: o, key: 'order_number' }) ?? o.id)} — ${String(attr({ item: o, key: 'user_name' }) ?? '')} (${String(
        attr({ item: o, key: 'status_formatted' }) ?? '',
      )})`,
  });
}

export async function productOptions({ auth, storeId }: { auth: ConnectionAuth; storeId?: unknown }) {
  return dropdownOptions({
    auth,
    path: '/products',
    query: { 'filter[store_id]': storeId ? String(storeId) : undefined },
    label: (p) => String(attr({ item: p, key: 'name' }) ?? p.id),
  });
}

export async function variantOptions({ auth, productId }: { auth: ConnectionAuth; productId?: unknown }) {
  return dropdownOptions({
    auth,
    path: '/variants',
    query: { 'filter[product_id]': productId ? String(productId) : undefined },
    label: (v) => String(attr({ item: v, key: 'name' }) ?? v.id),
  });
}

export const storeDropdown = ({ required, description }: { required: boolean; description: string }) =>
  Property.Dropdown({
    displayName: 'Store',
    description,
    required,
    auth: lemonSqueezyAuth,
    refreshers: ['auth'],
    options: async ({ auth }) => storeOptions({ auth }),
  });

export const pageProps = (noun: string) => ({
  page: Property.Number({
    displayName: 'Page',
    description: 'Page number for pagination (starts at 1).',
    required: false,
    defaultValue: 1,
  }),
  perPage: Property.Number({
    displayName: 'Per Page',
    description: `Number of ${noun} to return per page (1–100). Default is 10.`,
    required: false,
    defaultValue: 10,
  }),
});

async function dropdownOptions({
  auth,
  path,
  query,
  label,
}: {
  auth: ConnectionAuth;
  path: string;
  query?: Record<string, string | undefined>;
  label: (item: JsonApiResource) => string;
}): Promise<DropdownState> {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your account first.', options: [] };
  }
  try {
    const { items, truncated } = await listAllPages({ apiKey: auth.secret_text, path, query });
    return {
      disabled: false,
      options: items.map((item) => ({ label: label(item), value: item.id })),
      placeholder: truncated ? 'Showing the first 1,000 results. Use the ID field or a narrower filter for others.' : undefined,
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: `Could not load options: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function attr({ item, key }: { item: JsonApiResource; key: string }): unknown {
  return item.attributes[key];
}

type ConnectionAuth = { secret_text: string } | undefined;

type DropdownState = { disabled: boolean; placeholder?: string; options: { label: string; value: string }[] };
