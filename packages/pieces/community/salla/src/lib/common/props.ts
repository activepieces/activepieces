import { Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { SallaAuth, SallaQuery, sallaApi } from './client';
import { sallaUtils } from './helpers';
import { TriStateInput, sallaProducts } from './products';
import { sallaWebhooks } from './webhooks';

async function loadOptions({
  auth,
  path,
  query,
  toOption,
  maxItems = DROPDOWN_LIMIT,
  emptyHint,
}: {
  auth: SallaAuth | undefined;
  path: string;
  query?: SallaQuery;
  toOption: (item: Record<string, unknown>) => DropdownOption | undefined;
  maxItems?: number;
  emptyHint?: string;
}): Promise<DropdownState> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your Salla account first.' };
  }
  try {
    const { items, truncated } = await sallaApi.fetchPaged<unknown>({ auth, path, query, maxItems, perPage: 30 });
    const options = items
      .filter(sallaApi.isRecord)
      .map(toOption)
      .filter((option): option is DropdownOption => option !== undefined);
    return {
      disabled: false,
      options,
      placeholder: options.length === 0 ? emptyHint : truncated ? 'Showing the first results. Type to search.' : undefined,
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: describeLoadError(error),
    };
  }
}

function describeLoadError(error: unknown): string {
  if (sallaApi.isSallaApiError(error) && error.status === 401) {
    return `Could not load options: ${error.message}`;
  }
  return 'Could not load options from Salla. Check the connection and try again.';
}

function idOf(item: Record<string, unknown>): string | undefined {
  const id = item['id'];
  return typeof id === 'number' || typeof id === 'string' ? String(id) : undefined;
}

function textOf(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function orderLabel(item: Record<string, unknown>): string {
  const reference = textOf(item['reference_id']);
  const customer = item['customer'];
  const customerName = sallaApi.isRecord(customer)
    ? textOf(customer['full_name']) || `${textOf(customer['first_name'])} ${textOf(customer['last_name'])}`.trim()
    : '';
  const total = item['total'] ?? (sallaApi.isRecord(item['amounts']) ? item['amounts']['total'] : undefined);
  const amount = sallaUtils.amountOf(total);
  const currency = sallaApi.isRecord(total) ? textOf(total['currency']) : '';
  const status = item['status'];
  const statusName = sallaApi.isRecord(status) ? textOf(status['name']) : '';
  const parts = [
    reference ? `#${reference}` : `ID ${textOf(item['id'])}`,
    customerName,
    amount !== undefined ? `${amount} ${currency}`.trim() : '',
    statusName,
  ].filter((part) => part.length > 0);
  return parts.join(' · ');
}

function customerLabel(item: Record<string, unknown>): string {
  const name = `${textOf(item['first_name'])} ${textOf(item['last_name'])}`.trim() || textOf(item['full_name']);
  const contact = textOf(item['email']) || `${textOf(item['mobile_code'])}${textOf(item['mobile'])}`;
  if (name && contact) {
    return `${name} (${contact})`;
  }
  return name || contact || textOf(item['id']);
}

const order = <R extends boolean>({ required, displayName = 'Order', description = DEFAULT_ORDER_DESCRIPTION }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description,
    required,
    refreshers: [],
    auth: sallaAuth,
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      const search = typeof searchValue === 'string' ? searchValue.trim() : '';
      return loadOptions({
        auth,
        path: '/orders',
        query: search ? { keyword: search } : undefined,
        maxItems: DROPDOWN_LIMIT,
        emptyHint: search ? 'No order matches this search.' : 'No orders found in this store.',
        toOption: (item) => {
          const id = idOf(item);
          return id ? { label: orderLabel(item), value: id } : undefined;
        },
      });
    },
  });

const customer = <R extends boolean>({ required, displayName = 'Customer', description }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'Search by customer name or mobile number.',
    required,
    refreshers: [],
    auth: sallaAuth,
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      const search = typeof searchValue === 'string' ? searchValue.trim() : '';
      return loadOptions({
        auth,
        path: '/customers',
        query: search ? { keyword: search } : undefined,
        emptyHint: search ? 'No customer matches this search.' : 'No customers found in this store.',
        toOption: (item) => {
          const id = idOf(item);
          return id ? { label: customerLabel(item), value: id } : undefined;
        },
      });
    },
  });

async function orderStatusOptions({ auth, excludeCancel = false }: { auth: SallaAuth | undefined; excludeCancel?: boolean }): Promise<DropdownState> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your Salla account first.' };
  }
  try {
    const statuses = await sallaUtils.listOrderStatuses({ auth });
    const options = statuses
      .filter((status) => status.isActive)
      .filter((status) => !excludeCancel || !sallaUtils.isCancelStatus({ value: status.id, statuses }))
      .map((status) => ({
        label: status.type === 'custom' ? `${status.name} (custom${status.parentName ? `, under ${status.parentName}` : ''})` : status.name,
        value: status.id,
      }));
    return { disabled: false, options };
  } catch (error) {
    return { disabled: true, options: [], placeholder: describeLoadError(error) };
  }
}

const orderStatus = <R extends boolean>({
  required,
  displayName = 'Status',
  description,
  excludeCancel = false,
}: DropdownFactoryParams<R> & { excludeCancel?: boolean }) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'Order status, including the custom statuses created in this store.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) => orderStatusOptions({ auth, excludeCancel }),
  });

const orderStatuses = <R extends boolean>({ required, displayName = 'Statuses', description }: DropdownFactoryParams<R>) =>
  Property.MultiSelectDropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'One or more order statuses, including custom statuses.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) => orderStatusOptions({ auth }),
  });

const paymentMethods = <R extends boolean>({ required, displayName = 'Payment Methods', description }: DropdownFactoryParams<R>) =>
  Property.MultiSelectDropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'Payment methods enabled in this store.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) =>
      loadOptions({
        auth,
        path: '/payment/methods',
        emptyHint: 'No payment methods found. The Salla app needs the Payments (read) scope.',
        toOption: (item) => {
          const slug = textOf(item['slug']);
          return slug ? { label: textOf(item['name']) || slug, value: slug } : undefined;
        },
      }),
  });

const branch = <R extends boolean>({ required, displayName = 'Branch', description }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'Store branch or warehouse.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) =>
      loadOptions({
        auth,
        path: '/branches',
        emptyHint: 'No branches found. The Salla app needs the Branches (read) scope.',
        toOption: (item) => {
          const id = idOf(item);
          return id ? { label: textOf(item['name']) || id, value: id } : undefined;
        },
      }),
  });

const branches = <R extends boolean>({ required, displayName = 'Branches', description }: DropdownFactoryParams<R>) =>
  Property.MultiSelectDropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'One or more store branches or warehouses.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) =>
      loadOptions({
        auth,
        path: '/branches',
        emptyHint: 'No branches found. The Salla app needs the Branches (read) scope.',
        toOption: (item) => {
          const id = idOf(item);
          return id ? { label: textOf(item['name']) || id, value: id } : undefined;
        },
      }),
  });

function productLabel(item: Record<string, unknown>): string {
  const name = textOf(item['name']) || `Product ${textOf(item['id'])}`;
  const sku = textOf(item['sku']);
  const price = item['price'];
  const amount = sallaUtils.amountOf(price);
  const currency = sallaApi.isRecord(price) ? textOf(price['currency']) : '';
  const parts = [name, sku ? `SKU ${sku}` : '', amount !== undefined ? `${amount} ${currency}`.trim() : ''].filter((part) => part.length > 0);
  return parts.join(' · ');
}

const product = <R extends boolean>({ required, displayName = 'Product', description = DEFAULT_PRODUCT_DESCRIPTION }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description,
    required,
    refreshers: [],
    auth: sallaAuth,
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      const search = typeof searchValue === 'string' ? searchValue.trim() : '';
      return loadOptions({
        auth,
        path: '/products',
        query: search ? { keyword: search } : undefined,
        maxItems: DROPDOWN_LIMIT,
        emptyHint: search ? 'No product matches this search.' : 'No products found in this store.',
        toOption: (item) => {
          const id = idOf(item);
          return id ? { label: productLabel(item), value: id } : undefined;
        },
      });
    },
  });

async function variantOptions({ auth, productId }: { auth: SallaAuth | undefined; productId: unknown }): Promise<DropdownState> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your Salla account first.' };
  }
  const id = typeof productId === 'number' ? String(productId) : typeof productId === 'string' ? productId.trim() : '';
  if (!/^\d+$/.test(id)) {
    return { disabled: true, options: [], placeholder: 'Pick a product first.' };
  }
  try {
    const { variants } = await sallaProducts.listVariants({ auth, productId: id });
    const options = variants
      .map((variant) => {
        const variantId = idOf(variant);
        return variantId ? { label: textOf(variant['label']) || variantId, value: variantId } : undefined;
      })
      .filter((option): option is DropdownOption => option !== undefined);
    return {
      disabled: false,
      options,
      placeholder: options.length === 0 ? 'This product has no variants. Add options (such as size or color) to it in Salla first.' : undefined,
    };
  } catch (error) {
    return { disabled: true, options: [], placeholder: describeLoadError(error) };
  }
}

const variant = <R extends boolean>({
  required,
  displayName = 'Variant',
  description,
  productPropName = 'product',
}: DropdownFactoryParams<R> & { productPropName?: string }) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'The product variant (one option combination, such as Red / M). Lists the variants of the product picked above.',
    required,
    refreshers: [productPropName],
    auth: sallaAuth,
    options: async (propsValue) => variantOptions({ auth: propsValue.auth, productId: propsValue[productPropName] }),
  });

async function categoryOptions({ auth }: { auth: SallaAuth | undefined }): Promise<DropdownState> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your Salla account first.' };
  }
  try {
    const { categories, truncated } = await sallaProducts.listCategories({ auth, maxResults: CATEGORY_DROPDOWN_LIMIT });
    const options = categories.map((entry) => ({ label: entry.path, value: String(entry.id) }));
    return {
      disabled: false,
      options,
      placeholder:
        options.length === 0
          ? 'No categories found. The Salla app needs the Categories (read) scope.'
          : truncated
          ? 'Showing the first categories only.'
          : undefined,
    };
  } catch (error) {
    return { disabled: true, options: [], placeholder: describeLoadError(error) };
  }
}

const category = <R extends boolean>({ required, displayName = 'Category', description }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'Store category. Subcategories show their full path, for example Clothes > Shirts.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) => categoryOptions({ auth }),
  });

const categories = <R extends boolean>({ required, displayName = 'Categories', description }: DropdownFactoryParams<R>) =>
  Property.MultiSelectDropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'One or more store categories. Subcategories show their full path, for example Clothes > Shirts.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) => categoryOptions({ auth }),
  });

const brand = <R extends boolean>({ required, displayName = 'Brand', description }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'Store brand.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) =>
      loadOptions({
        auth,
        path: '/brands',
        maxItems: BRAND_DROPDOWN_LIMIT,
        emptyHint: 'No brands found. The Salla app needs the Brands (read) scope.',
        toOption: (item) => {
          const id = idOf(item);
          return id ? { label: textOf(item['name']) || id, value: id } : undefined;
        },
      }),
  });

const stockChangeReason = <R extends boolean>({ required, displayName = 'Reason', description }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'Why the stock changed, as recorded in the Salla quantity history (for example Restock or Damaged).',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Salla account first.' };
      }
      try {
        const { reasons } = await sallaProducts.listStockChangeReasons({ auth });
        const options = reasons
          .map((reason) => {
            const id = idOf(reason);
            return id ? { label: textOf(reason['name']) || id, value: id } : undefined;
          })
          .filter((option): option is DropdownOption => option !== undefined);
        return { disabled: false, options, placeholder: options.length === 0 ? 'No stock change reasons found.' : undefined };
      } catch (error) {
        return { disabled: true, options: [], placeholder: describeLoadError(error) };
      }
    },
  });

const triState = ({
  displayName,
  description,
  unchangedLabel = 'Leave unchanged',
}: {
  displayName: string;
  description: string;
  unchangedLabel?: string;
}) =>
  Property.StaticDropdown<Exclude<TriStateInput, boolean | null | undefined>, false>({
    displayName,
    description,
    required: false,
    defaultValue: 'unchanged',
    options: {
      disabled: false,
      options: [
        { label: unchangedLabel, value: 'unchanged' },
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });

const webhookRule = ({ description = DEFAULT_RULE_DESCRIPTION }: { description?: string } = {}) =>
  Property.ShortText({
    displayName: 'Salla Filter Rule',
    description,
    required: false,
    advanced: true,
  });

function customerGroupOptions({ auth }: { auth: SallaAuth | undefined }): Promise<DropdownState> {
  return loadOptions({
    auth,
    path: '/customers/groups',
    maxItems: CUSTOMER_GROUP_DROPDOWN_LIMIT,
    emptyHint: 'No customer groups found. Create one in Salla under Customers > Customer Groups.',
    toOption: (item) => {
      const id = idOf(item);
      return id ? { label: textOf(item['name']) || `Group ${id}`, value: id } : undefined;
    },
  });
}

const customerGroup = <R extends boolean>({ required, displayName = 'Customer Group', description }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'A customer group in this store, for example VIP Customers.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) => customerGroupOptions({ auth }),
  });

const customerGroups = <R extends boolean>({ required, displayName = 'Customer Groups', description }: DropdownFactoryParams<R>) =>
  Property.MultiSelectDropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'One or more customer groups in this store.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) => customerGroupOptions({ auth }),
  });

function couponLabel(item: Record<string, unknown>): string {
  const code = textOf(item['code']) || `Coupon ${textOf(item['id'])}`;
  const amount = sallaUtils.amountOf(item['amount']);
  const type = textOf(item['type']).toLowerCase();
  const currency = sallaApi.isRecord(item['amount']) ? textOf(item['amount']['currency']) : '';
  const discount =
    amount === undefined ? '' : type === 'percentage' || type === 'p' ? `${amount}%` : `${amount} ${currency}`.trim();
  const parts = [code, discount, textOf(item['status'])].filter((part) => part.length > 0);
  return parts.join(' · ');
}

const coupon = <R extends boolean>({ required, displayName = 'Coupon', description }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'Pick a coupon or search by its code. In a flow, map the numeric coupon ID (for example 1622617640), not the code.',
    required,
    refreshers: [],
    auth: sallaAuth,
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      const search = typeof searchValue === 'string' ? searchValue.trim() : '';
      return loadOptions({
        auth,
        path: '/coupons',
        query: search ? { keyword: search } : undefined,
        maxItems: DROPDOWN_LIMIT,
        emptyHint: search
          ? 'No coupon matches this search.'
          : 'No coupons found. The Salla app needs the Marketing (read) scope.',
        toOption: (item) => {
          const id = idOf(item);
          return id ? { label: couponLabel(item), value: id } : undefined;
        },
      });
    },
  });

function abandonedCartLabel(item: Record<string, unknown>): string {
  const customer = sallaApi.isRecord(item['customer']) ? item['customer'] : {};
  const name = textOf(customer['name']) || textOf(customer['mobile']);
  const amount = sallaUtils.amountOf(item['total']);
  const currency = sallaApi.isRecord(item['total']) ? textOf(item['total']['currency']) : textOf(item['currency']);
  const age = sallaUtils.amountOf(item['age_in_minutes']);
  const parts = [
    `Cart ${textOf(item['id'])}`,
    name,
    amount !== undefined ? `${amount} ${currency}`.trim() : '',
    age !== undefined ? `${Math.round(age)} min old` : '',
  ].filter((part) => part.length > 0);
  return parts.join(' · ');
}

const abandonedCart = <R extends boolean>({ required, displayName = 'Abandoned Cart', description }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description:
      description ?? 'Pick an abandoned cart or search by customer ID or mobile number. In a flow, map the numeric cart ID (for example 1097962121).',
    required,
    refreshers: [],
    auth: sallaAuth,
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      const search = typeof searchValue === 'string' ? searchValue.trim() : '';
      return loadOptions({
        auth,
        path: '/carts/abandoned',
        query: search ? { keyword: search } : undefined,
        maxItems: DROPDOWN_LIMIT,
        emptyHint: search
          ? 'No abandoned cart matches this search.'
          : 'No abandoned carts found. The Salla app needs the Abandoned Carts (read) scope.',
        toOption: (item) => {
          const id = idOf(item);
          return id ? { label: abandonedCartLabel(item), value: id } : undefined;
        },
      });
    },
  });

async function webhookEventOptions({ auth }: { auth: SallaAuth | undefined }): Promise<DropdownState> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your Salla account first.' };
  }
  try {
    const events = await sallaWebhooks.listWebhookEvents({ auth });
    const options = events.map((entry) => ({
      label: entry.label === entry.event ? entry.event : `${entry.label} (${entry.event})`,
      value: entry.event,
    }));
    return {
      disabled: false,
      options,
      placeholder: options.length === 0 ? 'Salla returned no webhook events. The Salla app needs the Webhooks (read) scope.' : undefined,
    };
  } catch (error) {
    return { disabled: true, options: [], placeholder: describeLoadError(error) };
  }
}

const webhookEvent = <R extends boolean>({ required, displayName = 'Event', description }: DropdownFactoryParams<R>) =>
  Property.Dropdown<string, R, typeof sallaAuth>({
    displayName,
    description: description ?? 'The Salla store event that starts the flow, for example order.created or customer.updated.',
    required,
    refreshers: [],
    auth: sallaAuth,
    options: async ({ auth }) => webhookEventOptions({ auth }),
  });

const DEFAULT_RULE_DESCRIPTION =
  'Optional condition Salla checks before sending the event, so the flow only runs for matching orders. Put text values in backticks. Examples: `total > 100` or ``payment_method = `mada` AND total > 50``. Order fields you can use include id, reference_id, customer_id, status_id, branch_id, coupon_code, total, sub_total, shipping_cost, payment_method and currency.';

const DROPDOWN_LIMIT = 60;
const CATEGORY_DROPDOWN_LIMIT = 500;
const BRAND_DROPDOWN_LIMIT = 300;
const CUSTOMER_GROUP_DROPDOWN_LIMIT = 300;
const DEFAULT_PRODUCT_DESCRIPTION =
  'Pick a product or search by name or SKU. In a flow, map the numeric product ID (for example 1672932878).';
const DEFAULT_ORDER_DESCRIPTION =
  'Pick an order or search by reference number, customer name or mobile. In a flow, map the order ID (for example 2116149737), not the reference number customers see.';

export const sallaProps = {
  order,
  customer,
  orderStatus,
  orderStatuses,
  paymentMethods,
  branch,
  branches,
  webhookRule,
  orderStatusOptions,
  product,
  variant,
  category,
  categories,
  brand,
  stockChangeReason,
  triState,
  variantOptions,
  categoryOptions,
  customerGroup,
  customerGroups,
  coupon,
  abandonedCart,
  webhookEvent,
  customerGroupOptions,
  webhookEventOptions,
};

type DropdownOption = { label: string; value: string };

type DropdownState = {
  disabled: boolean;
  options: DropdownOption[];
  placeholder?: string;
};

type DropdownFactoryParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
