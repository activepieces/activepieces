import { HttpMethod } from '@activepieces/pieces-common';
import { SallaAuth, SallaQuery, sallaApi } from './client';
import { CANCEL_SLUG, sallaUtils } from './helpers';

async function listOrders({ auth, filters }: { auth: SallaAuth; filters: OrderFilters }): Promise<OrderListResult> {
  const { items, truncated } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/orders',
    query: buildOrderListQuery(filters),
    maxItems: filters.maxResults,
    perPage: ORDERS_PER_PAGE,
  });
  const orders = items.filter(sallaApi.isRecord).map(sallaUtils.withOrderExtras);
  return { orders, count: orders.length, truncated };
}

function buildOrderListQuery(filters: OrderFilters): SallaQuery {
  const fromDate = sallaUtils.toStoreDate(filters.fromDate);
  const toDate = sallaUtils.toStoreDate(filters.toDate);
  const query: SallaQuery = {
    keyword: trimmed(filters.keyword),
    reference_id: filters.referenceId !== undefined ? sallaUtils.requireId({ value: filters.referenceId, label: 'Reference number' }) : undefined,
    customer_id: filters.customerId !== undefined ? sallaUtils.requireId({ value: filters.customerId, label: 'Customer ID' }) : undefined,
    from_date: fromDate,
    to_date: toDate,
    sort_by: filters.sortBy,
  };
  const statusIds = (filters.statusIds ?? []).map((value) => sallaUtils.requireId({ value, label: 'Status ID' }));
  if (statusIds.length > 0) {
    query['status'] = statusIds;
  }
  const paymentMethods = (filters.paymentMethods ?? [])
    .map((value) => sallaUtils.dropdownText(value))
    .filter((value): value is string => value !== undefined);
  if (paymentMethods.length > 0) {
    query['payment_method'] = paymentMethods;
  }
  const branchIds = (filters.branchIds ?? []).map((value) => sallaUtils.requireId({ value, label: 'Branch ID' }));
  if (branchIds.length > 0) {
    query['branch'] = branchIds;
  }
  return query;
}

async function getOrder({
  auth,
  orderId,
  includeItems,
}: {
  auth: SallaAuth;
  orderId: unknown;
  includeItems: boolean;
}): Promise<Record<string, unknown>> {
  const id = sallaUtils.requireId({ value: orderId, label: 'Order ID' });
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/orders/${id}`,
    query: { format: 'light' },
  });
  const order = sallaUtils.withOrderExtras(response.body.data);
  if (!includeItems) {
    return order;
  }
  const { items, truncated } = await listOrderItems({ auth, orderId: id });
  return { ...order, items, items_truncated: truncated };
}

async function listOrderItems({ auth, orderId }: { auth: SallaAuth; orderId: unknown }): Promise<OrderItemsResult> {
  const id = sallaUtils.requireId({ value: orderId, label: 'Order ID' });
  const { items, truncated } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/orders/items',
    query: { order_id: id },
    maxItems: MAX_ORDER_ITEMS,
    perPage: 60,
  });
  const records = items.filter(sallaApi.isRecord);
  return { items: records, count: records.length, truncated };
}

async function updateOrderStatus({
  auth,
  orderId,
  status,
  note,
  restoreItems,
  sendStatusSms,
}: {
  auth: SallaAuth;
  orderId: unknown;
  status: string | number;
  note?: string;
  restoreItems?: boolean;
  sendStatusSms?: boolean;
}): Promise<OrderStatusUpdateResult> {
  const id = sallaUtils.requireId({ value: orderId, label: 'Order ID' });
  const isNumericStatus = /^\d+$/.test(sallaUtils.normalizeDigits(String(status)).trim());
  if (!isNumericStatus && sallaUtils.isCancelStatus({ value: status, statuses: [] })) {
    throw new Error(CANCEL_NOT_ALLOWED_MESSAGE);
  }
  const statuses = isNumericStatus ? await sallaUtils.listOrderStatuses({ auth }) : [];
  if (sallaUtils.isCancelStatus({ value: status, statuses })) {
    throw new Error(CANCEL_NOT_ALLOWED_MESSAGE);
  }
  const target = sallaUtils.resolveStatusTarget({ value: status, statuses });
  return applyOrderStatus({ auth, id, target, note, restoreItems, sendStatusSms });
}

async function cancelOrder({
  auth,
  orderId,
  note,
  restoreItems,
  sendStatusSms,
}: {
  auth: SallaAuth;
  orderId: unknown;
  note?: string;
  restoreItems?: boolean;
  sendStatusSms?: boolean;
}): Promise<OrderStatusUpdateResult> {
  const id = sallaUtils.requireId({ value: orderId, label: 'Order ID' });
  return applyOrderStatus({ auth, id, target: { slug: CANCEL_SLUG }, note, restoreItems, sendStatusSms });
}

async function applyOrderStatus({
  auth,
  id,
  target,
  note,
  restoreItems,
  sendStatusSms,
}: {
  auth: SallaAuth;
  id: string;
  target: { slug: string } | { status_id: number };
  note?: string;
  restoreItems?: boolean;
  sendStatusSms?: boolean;
}): Promise<OrderStatusUpdateResult> {
  const body: Record<string, unknown> = { ...target };
  const trimmedNote = trimmed(note);
  if (trimmedNote) {
    body['note'] = trimmedNote;
  }
  if (restoreItems !== undefined) {
    body['restore_items'] = restoreItems;
  }
  if (sendStatusSms !== undefined) {
    body['send_status_sms'] = sendStatusSms;
  }
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/orders/${id}/status`,
    body,
  });
  const data = response.body.data;
  const message = sallaApi.isRecord(data) && typeof data['message'] === 'string' ? data['message'] : undefined;
  return {
    order_id: Number(id),
    slug: 'slug' in target ? target.slug : undefined,
    status_id: 'status_id' in target ? target.status_id : undefined,
    message,
  };
}

async function addOrderNote({ auth, orderId, note }: { auth: SallaAuth; orderId: unknown; note: string }): Promise<Record<string, unknown>> {
  const id = sallaUtils.requireId({ value: orderId, label: 'Order ID' });
  const text = trimmed(note);
  if (!text) {
    throw new Error('The note is empty. Write the text to add to the order history.');
  }
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/orders/${id}/histories`,
    body: { note: text },
    keepLargeIds: true,
  });
  const data = sallaApi.isRecord(response.body.data) ? response.body.data : {};
  const entryId = data['id'];
  const createdAtIso = sallaUtils.toIsoDate(data['created_at']);
  return {
    ...data,
    id: typeof entryId === 'string' || typeof entryId === 'number' ? String(entryId) : null,
    ...(createdAtIso ? { created_at_iso: createdAtIso } : {}),
  };
}

async function getInvoicePdf({ auth, orderId }: { auth: SallaAuth; orderId: unknown }): Promise<{ order_id: number; url: string | undefined }> {
  const id = sallaUtils.requireId({ value: orderId, label: 'Order ID' });
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/orders/${id}/print-invoice`,
  });
  const data = response.body.data;
  const url = sallaApi.isRecord(data) && typeof data['url'] === 'string' ? data['url'] : undefined;
  return { order_id: Number(id), url };
}

async function sendInvoice({ auth, orderId }: { auth: SallaAuth; orderId: unknown }): Promise<{ order_id: number; message: string | undefined }> {
  const id = sallaUtils.requireId({ value: orderId, label: 'Order ID' });
  try {
    const response = await sallaApi.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/orders/${id}/send-invoice`,
    });
    const data = response.body.data;
    const message = sallaApi.isRecord(data) && typeof data['message'] === 'string' ? data['message'] : undefined;
    return { order_id: Number(id), message };
  } catch (error) {
    if (sallaApi.isSallaApiError(error) && error.status === 422) {
      throw new Error(
        `Salla refused to send the invoice. It sends invoices only for orders whose status is Completed, so check the status of order ${id}. Salla said: ${sallaApi.extractVendorMessage(error.responseBody) ?? error.message}`,
      );
    }
    throw error;
  }
}

async function createOrder({ auth, input }: { auth: SallaAuth; input: CreateOrderInput }): Promise<Record<string, unknown>> {
  const isCashOnDelivery = trimmed(input.payment.method) === COD_METHOD;
  const cashOnDeliveryCurrency = isCashOnDelivery ? await fetchStoreCurrency(auth) : undefined;
  const body = buildCreateOrderBody({ ...input, payment: { ...input.payment, cashOnDeliveryCurrency } });
  try {
    const response = await sallaApi.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/orders',
      body,
    });
    return sallaUtils.withOrderExtras(response.body.data);
  } catch (error) {
    if (sallaApi.isSallaApiError(error) && isNoDeliveryNeededError({ status: error.status, responseBody: error.responseBody, body })) {
      throw new Error(
        `These products need no delivery: leave Delivery Method and Branch empty. Salla said: ${sallaApi.extractVendorMessage(error.responseBody) ?? error.message}`,
      );
    }
    throw error;
  }
}

function isNoDeliveryNeededError({
  status,
  responseBody,
  body,
}: {
  status: number;
  responseBody: unknown;
  body: Record<string, unknown>;
}): boolean {
  if (status !== 422 || (body['delivery_method'] === undefined && body['branch_id'] === undefined)) {
    return false;
  }
  const errorBody = sallaApi.isRecord(responseBody) ? responseBody['error'] : undefined;
  const fields = sallaApi.isRecord(errorBody) ? errorBody['fields'] : undefined;
  const products = sallaApi.isRecord(fields) ? fields['products'] : undefined;
  const messages = Array.isArray(products) ? products : [products];
  return messages.some((message) => typeof message === 'string' && NO_DELIVERY_NEEDED_MESSAGES.some((pattern) => pattern.test(message)));
}

const NO_DELIVERY_NEEDED_MESSAGES = [/لا تتطلب الشحن/, /do not require shipping/i];

function buildCreateOrderBody(input: CreateOrderInput): Record<string, unknown> {
  if (input.products.length === 0) {
    throw new Error('Add at least one product to the order.');
  }
  const customerId = sallaUtils.optionalNumber({ value: input.customer.id, label: 'Customer ID' });
  if (customerId === undefined && !trimmed(input.customer.mobile)) {
    throw new Error('Pick an existing customer, or give the new customer\'s name and mobile number.');
  }
  const body: Record<string, unknown> = {
    customer: customerId !== undefined
      ? { id: customerId }
      : { name: trimmed(input.customer.name), mobile: trimmed(input.customer.mobile), email: trimmed(input.customer.email) },
    receiver: input.receiver ? buildReceiver(input.receiver) : undefined,
    payment: {
      status: input.payment.status,
      method: trimmed(input.payment.method),
      accepted_methods: acceptedMethods(input.payment.acceptedMethod),
      reference_id: sallaUtils.optionalNumber({ value: input.payment.referenceId, label: 'Bank or subscription ID' }),
      receipt_image_path: trimmed(input.payment.receiptImagePath),
      cash_on_delivery: buildCashOnDelivery({
        method: trimmed(input.payment.method),
        fee: input.payment.cashOnDeliveryFee,
        currency: input.payment.cashOnDeliveryCurrency,
      }),
    },
    delivery_method: input.deliveryMethod,
    branch_id: sallaUtils.optionalNumber({ value: input.branchId, label: 'Branch ID' }),
    courier_id: trimmed(input.courierId),
    ship_to: input.shipTo ? buildAddress({ address: input.shipTo, longitudeKey: 'lang', requiredKeys: CREATE_ADDRESS_REQUIRED_KEYS }) : undefined,
    products: input.products.map(buildProductLine),
    coupon_code: trimmed(input.couponCode),
  };
  return sallaUtils.compact(body);
}

async function updateOrder({
  auth,
  orderId,
  input,
}: {
  auth: SallaAuth;
  orderId: unknown;
  input: UpdateOrderInput;
}): Promise<Record<string, unknown>> {
  const id = sallaUtils.requireId({ value: orderId, label: 'Order ID' });
  const isCashOnDelivery = trimmed(input.payment?.method) === COD_METHOD;
  const cashOnDeliveryCurrency = isCashOnDelivery ? await fetchStoreCurrency(auth) : undefined;
  const body = buildUpdateOrderBody(
    input.payment ? { ...input, payment: { ...input.payment, cashOnDeliveryCurrency } } : input,
  );
  if (Object.keys(body).length === 0) {
    throw new Error('Nothing to update. Fill at least one field to change on the order.');
  }
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `/orders/${id}`,
    body,
  });
  return sallaUtils.withOrderExtras(response.body.data);
}

function refuseCustomerDetails({ name, mobile, email }: { name: unknown; mobile: unknown; email: unknown }): void {
  const filled = [name, mobile, email].some((value) => (typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null));
  if (filled) {
    throw new Error(
      'Salla cannot change a customer\'s name, mobile or email from an order: it moves the order to the store\'s visitor customer instead. Nothing was sent. Clear Customer Name, Customer Mobile and Customer Email, and use Update Customer to change the customer.',
    );
  }
}

function buildUpdateOrderBody(input: UpdateOrderInput): Record<string, unknown> {
  const customerId = sallaUtils.optionalNumber({ value: input.customerId, label: 'Customer ID' });
  const payment = input.payment
    ? sallaUtils.compact({
        status: trimmed(input.payment.status),
        method: trimmed(input.payment.method),
        store_bank_id: sallaUtils.optionalNumber({ value: input.payment.storeBankId, label: 'Store bank ID' }),
        receipt_image_path: trimmed(input.payment.receiptImagePath),
        accepted_methods: input.payment.acceptedMethods && input.payment.acceptedMethods.length > 0 ? input.payment.acceptedMethods : undefined,
        cash_on_delivery: buildCashOnDelivery({
          method: trimmed(input.payment.method),
          fee: input.payment.cashOnDeliveryFee,
          currency: input.payment.cashOnDeliveryCurrency,
        }),
      })
    : {};
  const employees = (input.employeeIds ?? []).map((value) => Number(sallaUtils.requireId({ value, label: 'Employee ID' })));
  return sallaUtils.compact({
    customer: customerId !== undefined ? { id: customerId } : undefined,
    receiver: input.receiver ? buildReceiver(input.receiver) : undefined,
    delivery_method: input.deliveryMethod,
    branch_id: sallaUtils.optionalNumber({ value: input.branchId, label: 'Branch ID' }),
    courier_id: sallaUtils.optionalNumber({ value: input.courierId, label: 'Courier ID' }),
    ship_to: input.shipTo ? buildAddress({ address: input.shipTo, longitudeKey: 'lng', requiredKeys: UPDATE_ADDRESS_REQUIRED_KEYS }) : undefined,
    payment: Object.keys(payment).length > 0 ? payment : undefined,
    coupon_code: trimmed(input.couponCode),
    employees: employees.length > 0 ? employees : undefined,
  });
}

function acceptedMethods(method: string | undefined): string[] | undefined {
  const value = trimmed(method);
  return value ? [value] : undefined;
}

function buildCashOnDelivery({
  method,
  fee,
  currency,
}: {
  method: string | undefined;
  fee: string | number | undefined;
  currency: string | undefined;
}): { amount: number; currency: string } | undefined {
  if (method !== COD_METHOD) {
    return undefined;
  }
  const amount = sallaUtils.optionalNumber({ value: fee, label: 'Cash on delivery fee' }) ?? 0;
  if (amount < 0) {
    throw new Error('Cash on delivery fee cannot be negative.');
  }
  if (!currency) {
    throw new Error('Could not read the store currency, which Salla needs for cash on delivery orders. Try again.');
  }
  return { amount, currency };
}

async function fetchStoreCurrency(auth: SallaAuth): Promise<string | undefined> {
  const response = await sallaApi.request<unknown>({ auth, method: HttpMethod.GET, path: '/store/info' });
  const data = sallaApi.isRecord(response.body) ? response.body['data'] : undefined;
  const currency = sallaApi.isRecord(data) ? data['currency'] : undefined;
  return typeof currency === 'string' && currency.trim().length > 0 ? currency.trim() : undefined;
}

function buildReceiver(receiver: ReceiverInput): Record<string, unknown> {
  return sallaUtils.compact({
    name: trimmed(receiver.name),
    phone: trimmed(receiver.phone),
    email: trimmed(receiver.email),
    country_code: trimmed(receiver.countryCode),
    notify: receiver.notify,
  });
}

function buildAddress({
  address,
  longitudeKey,
  requiredKeys,
}: {
  address: AddressInput;
  longitudeKey: 'lang' | 'lng';
  requiredKeys: string[];
}): Record<string, unknown> {
  const latitude = sallaUtils.optionalNumber({ value: address.latitude, label: 'Latitude' });
  const longitude = sallaUtils.optionalNumber({ value: address.longitude, label: 'Longitude' });
  if ((latitude === undefined) !== (longitude === undefined)) {
    throw new Error('Give both latitude and longitude for the shipping address, or neither.');
  }
  const result = sallaUtils.compact({
    country: sallaUtils.optionalNumber({ value: address.countryId, label: 'Country ID' }),
    city: sallaUtils.optionalNumber({ value: address.cityId, label: 'City ID' }),
    district: sallaUtils.optionalNumber({ value: address.districtId, label: 'District ID' }),
    block: trimmed(address.block),
    street_number: trimmed(address.streetNumber),
    address_line: trimmed(address.addressLine),
    postal_code: trimmed(address.postalCode),
    short_address: trimmed(address.shortAddress),
    building_number: trimmed(address.buildingNumber),
    additional_number: trimmed(address.additionalNumber),
    geo_coordinates:
      latitude !== undefined && longitude !== undefined ? { lat: latitude, [longitudeKey]: longitude } : undefined,
  });
  if (Object.keys(result).length > 0) {
    const missing = requiredKeys.filter((key) => !(key in result));
    if (missing.length > 0) {
      throw new Error(
        `The shipping address is incomplete. Salla needs the full National Address; missing: ${missing.join(', ')}. Fill every address field, or leave them all empty.`,
      );
    }
  }
  return result;
}

function buildProductLine(line: ProductLineInput): Record<string, unknown> {
  const identifier = trimmed(String(line.identifier ?? ''));
  if (!identifier) {
    throw new Error('Each product line needs a product ID or SKU.');
  }
  const quantity = sallaUtils.optionalNumber({ value: line.quantity, label: 'Quantity' }) ?? 1;
  if (quantity <= 0) {
    throw new Error(`Quantity for product ${identifier} must be greater than 0.`);
  }
  return {
    identifier_type: line.identifierType,
    identifier: line.identifierType === 'id' ? Number(sallaUtils.requireId({ value: identifier, label: 'Product ID' })) : identifier,
    quantity,
  };
}

function trimmed(value: string | undefined | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const result = value.trim();
  return result.length > 0 ? result : undefined;
}

const ORDERS_PER_PAGE = 30;
const COD_METHOD = 'cod';
const CANCEL_NOT_ALLOWED_MESSAGE = 'Update Order Status does not cancel orders. Use the Cancel Order action to cancel this order.';
const CREATE_ADDRESS_REQUIRED_KEYS = ['country', 'city', 'district', 'block', 'street_number', 'address_line', 'postal_code', 'short_address', 'geo_coordinates'];
const UPDATE_ADDRESS_REQUIRED_KEYS = [...CREATE_ADDRESS_REQUIRED_KEYS, 'building_number', 'additional_number'];
const MAX_ORDER_ITEMS = 500;

export const sallaOrders = {
  listOrders,
  buildOrderListQuery,
  getOrder,
  listOrderItems,
  updateOrderStatus,
  cancelOrder,
  addOrderNote,
  getInvoicePdf,
  sendInvoice,
  createOrder,
  buildCreateOrderBody,
  updateOrder,
  refuseCustomerDetails,
  buildUpdateOrderBody,
};

type OrderFilters = {
  maxResults: number;
  keyword?: string;
  referenceId?: string | number;
  customerId?: string | number;
  fromDate?: string;
  toDate?: string;
  statusIds?: Array<string | number>;
  paymentMethods?: string[];
  branchIds?: Array<string | number>;
  sortBy?: 'id' | 'total' | 'updated_at' | 'created_at';
};

type OrderListResult = {
  orders: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

type OrderItemsResult = {
  items: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

type OrderStatusUpdateResult = {
  order_id: number;
  slug?: string;
  status_id?: number;
  message?: string;
};

type ReceiverInput = {
  name?: string;
  phone?: string;
  email?: string;
  countryCode?: string;
  notify?: boolean;
};

type AddressInput = {
  countryId?: string | number;
  cityId?: string | number;
  districtId?: string | number;
  block?: string;
  streetNumber?: string;
  addressLine?: string;
  postalCode?: string;
  shortAddress?: string;
  buildingNumber?: string;
  additionalNumber?: string;
  latitude?: string | number;
  longitude?: string | number;
};

type ProductLineInput = {
  identifierType: 'id' | 'sku';
  identifier: string | number;
  quantity?: string | number;
};

type CreateOrderInput = {
  customer: { id?: string | number; name?: string; mobile?: string; email?: string };
  receiver?: ReceiverInput;
  payment: {
    status: 'paid' | 'pending_payment';
    method?: string;
    acceptedMethod?: string;
    referenceId?: string | number;
    receiptImagePath?: string;
    cashOnDeliveryFee?: string | number;
    cashOnDeliveryCurrency?: string;
  };
  deliveryMethod?: 'shipping' | 'pickup';
  branchId?: string | number;
  courierId?: string;
  shipTo?: AddressInput;
  products: ProductLineInput[];
  couponCode?: string;
};

type UpdateOrderInput = {
  customerId?: string | number;
  receiver?: ReceiverInput;
  deliveryMethod?: 'shipping' | 'pickup';
  branchId?: string | number;
  courierId?: string | number;
  shipTo?: AddressInput;
  payment?: {
    status?: string;
    method?: string;
    storeBankId?: string | number;
    receiptImagePath?: string;
    acceptedMethods?: string[];
    cashOnDeliveryFee?: string | number;
    cashOnDeliveryCurrency?: string;
  };
  couponCode?: string;
  employeeIds?: Array<string | number>;
};

export type {
  OrderFilters,
  OrderListResult,
  OrderItemsResult,
  OrderStatusUpdateResult,
  ReceiverInput,
  AddressInput,
  ProductLineInput,
  CreateOrderInput,
  UpdateOrderInput,
};
