import { Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { SallaAuth, SallaQuery, sallaApi } from './client';
import { sallaUtils } from './helpers';

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

const webhookRule = () =>
  Property.ShortText({
    displayName: 'Salla Filter Rule',
    description:
      'Optional condition Salla checks before sending the event, so the flow only runs for matching orders. Put text values in backticks. Examples: `total > 100` or ``payment_method = `mada` AND total > 50``. Order fields you can use include id, reference_id, customer_id, status_id, branch_id, coupon_code, total, sub_total, shipping_cost, payment_method and currency.',
    required: false,
    advanced: true,
  });

const DROPDOWN_LIMIT = 60;
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
