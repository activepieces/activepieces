import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient, SquareAuth } from './client';
import { squareShape } from './shape';

const DROPDOWN_MAX = 1000;
const LINE_ITEM_ITEMS_MAX = 500;
const CUSTOMER_MATCH_MAX = 100;
const CUSTOMER_SCAN_MAX = 10000;

function location({ required, displayName = 'Location', description }: { required: boolean; displayName?: string; description?: string }) {
  return Property.Dropdown({
    auth: squareAuth,
    displayName,
    description: description ?? (required ? 'The Square location (store) to use.' : 'The Square location (store) to use. Leave empty for your main location.'),
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return connectFirst();
      }
      try {
        const body = await squareClient.request<unknown>({ auth, method: HttpMethod.GET, path: ['v2', 'locations'], operation: 'list locations' });
        const options = squareShape
          .list({ value: body, key: 'locations' })
          .map(squareShape.location)
          .filter((l) => l.id !== null && l.status === 'ACTIVE')
          .map((l) => ({ label: `${l.name ?? l.id}${l.currency ? ` (${l.currency})` : ''}`, value: l.id ?? '' }));
        return options.length > 0 ? { disabled: false, options } : { disabled: true, placeholder: 'No active locations found in Square.', options: [] };
      } catch (error) {
        return failed({ error, what: 'locations' });
      }
    },
  });
}

function customer({ required, displayName = 'Customer', description }: { required: boolean; displayName?: string; description?: string }) {
  return Property.Dropdown({
    auth: squareAuth,
    displayName,
    description:
      description ??
      'Pick a customer. Type an email to search all customers, or part of a name to search the 10,000 newest. For an older customer, search by email or map the Customer ID.',
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return connectFirst();
      }
      try {
        const term = (searchValue ?? '').trim().toLowerCase();
        const customers = term.includes('@')
          ? await searchCustomersByEmail({ auth, email: term })
          : await listCustomers({ auth, nameTerm: term.length > 0 ? term : undefined });
        const options = customers
          .filter((c) => term.length === 0 || customerLabel(c).toLowerCase().includes(term))
          .slice(0, DROPDOWN_MAX)
          .map((c) => ({ label: customerLabel(c), value: c.id ?? '' }));
        if (options.length === 0) {
          return { disabled: false, placeholder: term ? 'No customer matches this search.' : 'No customers found. New customers can take a few seconds to appear.', options: [] };
        }
        return { disabled: false, options };
      } catch (error) {
        return failed({ error, what: 'customers' });
      }
    },
  });
}

function catalogItem({ required, displayName = 'Item', description }: { required: boolean; displayName?: string; description?: string }) {
  return Property.Dropdown({
    auth: squareAuth,
    displayName,
    description: description ?? 'Pick a catalog item. Type to search by name.',
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return connectFirst();
      }
      try {
        const items = await searchItems({ auth, text: searchValue, productTypes: undefined, max: DROPDOWN_MAX });
        const options = items.map((i) => ({ label: i.name ?? i.id ?? '', value: i.id ?? '' }));
        return options.length > 0 ? { disabled: false, options } : { disabled: false, placeholder: 'No items found.', options: [] };
      } catch (error) {
        return failed({ error, what: 'catalog items' });
      }
    },
  });
}

function variation({ required, itemProp = 'item', displayName = 'Variation', description }: { required: boolean; itemProp?: string; displayName?: string; description?: string }) {
  return Property.Dropdown({
    auth: squareAuth,
    displayName,
    description: description ?? 'The item variation (size, color, ...). Items without options have a single "Regular" variation.',
    required,
    refreshers: [itemProp],
    options: async (propsValue) => {
      const auth = propsValue.auth;
      const itemId = propsValue[itemProp];
      if (!auth) {
        return connectFirst();
      }
      if (typeof itemId !== 'string' || itemId.length === 0) {
        return { disabled: true, placeholder: 'Select an item first.', options: [] };
      }
      try {
        const body = await squareClient.request<unknown>({ auth, method: HttpMethod.GET, path: ['v2', 'catalog', 'object', itemId], operation: 'read the item' });
        const itemData = squareShape.rec({ value: squareShape.rec({ value: body, key: 'object' }), key: 'item_data' });
        const options = squareShape
          .list({ value: itemData, key: 'variations' })
          .map((raw) => squareShape.variation(raw))
          .filter((v) => v.id !== null)
          .map((v) => ({ label: variationLabel(v), value: v.id ?? '' }));
        return options.length > 0 ? { disabled: false, options } : { disabled: true, placeholder: 'This item has no variations.', options: [] };
      } catch (error) {
        return failed({ error, what: 'variations' });
      }
    },
  });
}

function category({ required, displayName = 'Category', description }: { required: boolean; displayName?: string; description?: string }) {
  return Property.Dropdown({
    auth: squareAuth,
    displayName,
    description: description ?? 'The catalog category for the item.',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return connectFirst();
      }
      try {
        const objects = await listCatalog({ auth, types: 'CATEGORY' });
        const options = objects.map((o) => ({ label: squareShape.str({ value: squareShape.rec({ value: o, key: 'category_data' }), key: 'name' }) ?? String(o['id']), value: String(o['id']) }));
        return options.length > 0 ? { disabled: false, options } : { disabled: false, placeholder: 'No categories found.', options: [] };
      } catch (error) {
        return failed({ error, what: 'categories' });
      }
    },
  });
}

function lineItems({ displayName = 'Line Items', description }: { displayName?: string; description?: string } = {}) {
  return Property.DynamicProperties({
    auth: squareAuth,
    displayName,
    description: description ?? 'What the order contains. Pick a catalog item, or leave Catalog Item empty and fill Custom Name and Custom Price.',
    required: true,
    refreshers: [],
    props: async ({ auth }) => {
      let options: DropdownOption<string>[] = [];
      if (auth) {
        try {
          const items = await searchItemObjects({ auth, text: undefined, productTypes: undefined, max: LINE_ITEM_ITEMS_MAX });
          options = items
            .flatMap((raw) => {
              const name = squareShape.str({ value: squareShape.rec({ value: raw, key: 'item_data' }), key: 'name' }) ?? squareShape.str({ value: raw, key: 'id' });
              return squareShape
                .list({ value: squareShape.rec({ value: raw, key: 'item_data' }), key: 'variations' })
                .map((variationRaw) => squareShape.variation(variationRaw))
                .filter((v) => v.id !== null)
                .map((v) => ({ label: `${name}${v.name && v.name !== 'Regular' ? ` - ${v.name}` : ''}${v.price ? ` (${v.price} ${v.currency ?? ''})` : ''}`.trim(), value: v.id ?? '' }));
            })
            .slice(0, DROPDOWN_MAX);
        } catch {
          options = [];
        }
      }
      return {
        items: Property.Array({
          displayName: 'Items',
          required: true,
          properties: {
            variation_id: Property.StaticDropdown({
              displayName: 'Catalog Item',
              required: false,
              options: { disabled: false, options },
            }),
            name: Property.ShortText({ displayName: 'Custom Name', description: 'For an item that is not in the catalog.', required: false }),
            price: Property.ShortText({ displayName: 'Custom Price', description: 'Unit price for a custom item, for example 12.50.', required: false }),
            quantity: Property.ShortText({ displayName: 'Quantity', description: 'Whole number, defaults to 1.', required: false }),
            note: Property.ShortText({ displayName: 'Note', required: false }),
          },
        }),
      };
    },
  });
}

function locationIdText({ required = false }: { required?: boolean } = {}) {
  return Property.ShortText({
    displayName: 'Location ID',
    description: required ? 'Square location ID (from List Locations).' : 'Square location ID (from List Locations). Leave empty to use the main location.',
    required,
  });
}

function idText({ displayName, description, required = true }: { displayName: string; description: string; required?: boolean }) {
  return Property.ShortText({ displayName, description, required });
}

function limitProp({ max, fallback }: { max: number; fallback: number }) {
  return Property.Number({ displayName: 'Limit', description: `How many results to return (1-${max}, default ${fallback}).`, required: false, defaultValue: fallback });
}

function cursorProp() {
  return Property.ShortText({ displayName: 'Cursor', description: 'Next Cursor from a previous run, to get the next page. Cursors expire after about 5 minutes.', required: false });
}

function idempotencyKey() {
  return Property.ShortText({
    displayName: 'Idempotency Key',
    description: 'Optional, up to 45 characters. Leave empty: a retried step returns the same record, but identical calls in one run (such as a loop with the same input) count as one. Set a unique value, like the loop item, to keep them separate.',
    required: false,
  });
}

function customerFields({ forUpdate }: { forUpdate: boolean }) {
  const keep = forUpdate ? ' Leave empty to keep the current value.' : '';
  return {
    given_name: Property.ShortText({ displayName: 'First Name', description: `Given name.${keep}`, required: false }),
    family_name: Property.ShortText({ displayName: 'Last Name', description: `Family name.${keep}`, required: false }),
    company_name: Property.ShortText({ displayName: 'Company', required: false, description: forUpdate ? keep.trim() : undefined }),
    nickname: Property.ShortText({ displayName: 'Nickname', required: false }),
    email_address: Property.ShortText({ displayName: 'Email', required: false }),
    phone_number: Property.ShortText({ displayName: 'Phone', description: 'Phone number in international format, for example +14155550123.', required: false }),
    birthday: Property.ShortText({ displayName: 'Birthday', description: 'YYYY-MM-DD, or 0000-MM-DD when the year is unknown.', required: false }),
    note: Property.LongText({ displayName: 'Note', required: false }),
    reference_id: Property.ShortText({ displayName: 'Reference ID', description: 'Your own ID for this customer, for example from your CRM.', required: false }),
    address_line_1: Property.ShortText({ displayName: 'Address Line 1', required: false }),
    address_line_2: Property.ShortText({ displayName: 'Address Line 2', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    state: Property.ShortText({ displayName: 'State / Region', required: false }),
    postal_code: Property.ShortText({ displayName: 'Postal Code', required: false }),
    country: Property.ShortText({ displayName: 'Country', description: 'Two-letter country code, for example US.', required: false }),
  };
}

function clearCustomerFields() {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Fields to Clear',
    description: 'Fields to empty on the customer. A field you also fill above is set, not cleared. Address clears the whole address.',
    required: false,
    options: {
      options: [
        { label: 'First Name', value: 'given_name' },
        { label: 'Last Name', value: 'family_name' },
        { label: 'Company', value: 'company_name' },
        { label: 'Nickname', value: 'nickname' },
        { label: 'Email', value: 'email_address' },
        { label: 'Phone', value: 'phone_number' },
        { label: 'Birthday', value: 'birthday' },
        { label: 'Note', value: 'note' },
        { label: 'Reference ID', value: 'reference_id' },
        { label: 'Address', value: 'address' },
      ],
    },
  });
}

async function listCustomers({ auth, nameTerm }: { auth: SquareAuth; nameTerm?: string }) {
  const results: ReturnType<typeof squareShape.customer>[] = [];
  let scanned = 0;
  let cursor: string | undefined;
  do {
    const body = await squareClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: ['v2', 'customers'],
      query: { limit: 100, sort_field: 'CREATED_AT', sort_order: 'DESC', cursor },
      operation: 'list customers',
    });
    const page = squareShape.list({ value: body, key: 'customers' }).map(squareShape.customer);
    scanned += page.length;
    results.push(...(nameTerm ? page.filter((c) => customerLabel(c).toLowerCase().includes(nameTerm)) : page));
    cursor = squareShape.str({ value: body, key: 'cursor' }) ?? undefined;
  } while (cursor && (nameTerm ? results.length < CUSTOMER_MATCH_MAX && scanned < CUSTOMER_SCAN_MAX : results.length < DROPDOWN_MAX));
  return results;
}

async function searchCustomersByEmail({ auth, email }: { auth: SquareAuth; email: string }) {
  const body = await squareClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['v2', 'customers', 'search'],
    body: { query: { filter: { email_address: { fuzzy: email } } }, limit: 100 },
    operation: 'search customers',
  });
  return squareShape.list({ value: body, key: 'customers' }).map(squareShape.customer);
}

async function searchItems(params: { auth: SquareAuth; text: string | undefined; productTypes: string[] | undefined; max: number }) {
  return (await searchItemObjects(params)).map(squareShape.catalogItem);
}

async function searchItemObjects({ auth, text, productTypes, max }: { auth: SquareAuth; text: string | undefined; productTypes: string[] | undefined; max: number }) {
  const results: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  const textFilter = text && text.trim().length > 0 ? text.trim() : undefined;
  do {
    const body = await squareClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: ['v2', 'catalog', 'search-catalog-items'],
      body: { text_filter: textFilter, product_types: productTypes, limit: 100, cursor },
      operation: 'search catalog items',
    });
    results.push(...squareShape.list({ value: body, key: 'items' }));
    cursor = squareShape.str({ value: body, key: 'cursor' }) ?? undefined;
  } while (cursor && results.length < max);
  return results.slice(0, max);
}

async function listCatalog({ auth, types }: { auth: SquareAuth; types: string }) {
  const results: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  do {
    const body = await squareClient.request<unknown>({ auth, method: HttpMethod.GET, path: ['v2', 'catalog', 'list'], query: { types, cursor }, operation: 'list the catalog' });
    results.push(...squareShape.list({ value: body, key: 'objects' }).filter((o) => typeof o['id'] === 'string'));
    cursor = squareShape.str({ value: body, key: 'cursor' }) ?? undefined;
  } while (cursor && results.length < DROPDOWN_MAX);
  return results.slice(0, DROPDOWN_MAX);
}

function customerLabel(c: ReturnType<typeof squareShape.customer>): string {
  const name = [c.given_name, c.family_name].filter(Boolean).join(' ') || c.company_name || c.nickname || '';
  const contact = c.email_address ?? c.phone_number ?? '';
  if (name && contact) {
    return `${name} (${contact})`;
  }
  return name || contact || (c.id ?? '');
}

function variationLabel(v: ReturnType<typeof squareShape.variation>): string {
  const price = v.price ? ` - ${v.price} ${v.currency ?? ''}`.trimEnd() : '';
  const sku = v.sku ? ` [${v.sku}]` : '';
  return `${v.name ?? v.id}${sku}${price}`;
}

function connectFirst() {
  return { disabled: true, placeholder: 'Connect your Square account first.', options: [] };
}

function failed({ error, what }: { error: unknown; what: string }) {
  const message = error instanceof Error ? error.message : 'unknown error';
  return { disabled: true, placeholder: `Could not load ${what}: ${message}`.slice(0, 300), options: [] };
}

export const squareProps = {
  location,
  customer,
  catalogItem,
  variation,
  category,
  lineItems,
  locationIdText,
  idText,
  limitProp,
  cursorProp,
  idempotencyKey,
  customerFields,
  clearCustomerFields,
};

export const squareLookups = { listCustomers, searchItems };
