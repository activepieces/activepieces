import { randomUUID } from 'crypto';
import {
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, tryCatch } from '@activepieces/pieces-framework';
import {
  SHOPIFY_API_VERSION,
  ShopifyAuth,
  shopifyAuthHelpers,
} from './auth';

async function shopifyGraphql<TData>(
  params: ShopifyGraphqlParams
): Promise<ShopifyGraphqlResult<TData>> {
  const { idempotencyKey } = params;
  if (idempotencyKey === undefined) {
    return sendGraphqlRequest<TData>(params);
  }
  const { data, error } = await tryCatch(() => sendGraphqlRequest<TData>(params));
  if (error) {
    throw new Error(`${error.message} ${idempotencyHint({ message: error.message, idempotencyKey })}`);
  }
  return data;
}

function idempotencyHint({
  message,
  idempotencyKey,
}: {
  message: string;
  idempotencyKey: string;
}): string {
  if (message.includes('CHANGE_FROM_QUANTITY_STALE')) {
    return `[idempotency_key used: ${idempotencyKey}. The current quantity changed since it was read: read it again with list_inventory_levels and retry with the new expected_quantity and a new idempotency_key.]`;
  }
  return `[idempotency_key used: ${idempotencyKey}. Retry with this same idempotency_key so Shopify does not repeat the operation.]`;
}

async function sendGraphqlRequest<TData>({
  auth,
  query,
  variables,
  idempotencyKey,
  primaryPaths,
  toleratedUserErrorCodes,
}: ShopifyGraphqlParams): Promise<ShopifyGraphqlResult<TData>> {
  const requestVariables: Record<string, unknown> = { ...(variables ?? {}) };
  if (idempotencyKey !== undefined) {
    requestVariables['idempotencyKey'] = idempotencyKey;
  }
  const { data: response, error } = await tryCatch(() =>
    httpClient.sendRequest<ShopifyGraphqlResponse<TData>>({
      method: HttpMethod.POST,
      url: `${shopifyAuthHelpers.getBaseUrl(auth)}/graphql.json`,
      headers: {
        ...shopifyAuthHelpers.getAuthHeaders(auth),
        'Content-Type': 'application/json',
      },
      body: { query, variables: requestVariables },
    })
  );
  if (error) {
    throw toHttpError(error);
  }
  const body = response.body;
  const errors = Array.isArray(body?.errors) ? body.errors : [];
  const throttled = errors.find(
    (entry) => entry.extensions?.code === 'THROTTLED'
  );
  if (throttled) {
    const throttleStatus = body?.extensions?.cost?.throttleStatus;
    throw new Error(
      `Shopify rate limit reached (THROTTLED). Wait a few seconds and retry. Throttle status: ${JSON.stringify(
        throttleStatus ?? {}
      )}`
    );
  }
  const data = body?.data;
  if (data === null || data === undefined) {
    throw toGraphqlError(errors);
  }
  const withheld = findWithheldMutationResult({
    query,
    errors,
    primaryPaths: primaryPaths ?? [],
  });
  if (withheld) {
    throwOnUserErrors({ data, toleratedCodes: toleratedUserErrorCodes ?? [] });
    throw toWithheldResultError(withheld);
  }
  const blocking = errors.filter(
    (entry) => !isFieldRedaction({ entry, primaryPaths: primaryPaths ?? [] })
  );
  if (blocking.length > 0) {
    throw toGraphqlError(blocking);
  }
  throwOnUserErrors({ data, toleratedCodes: toleratedUserErrorCodes ?? [] });
  const redactedFields = errors.map((entry) =>
    (entry.path ?? []).map((segment) => String(segment)).join('.')
  );
  return { data, redactedFields };
}

function isFieldRedaction({
  entry,
  primaryPaths,
}: {
  entry: ShopifyGraphqlError;
  primaryPaths: string[];
}): boolean {
  const path = entry.path ?? [];
  if (path.length < 2) {
    return false;
  }
  if (isPrimaryPath({ path, primaryPaths })) {
    return false;
  }
  const code = entry.extensions?.code;
  if (code === 'ACCESS_DENIED') {
    return true;
  }
  return isProtectedDataDenial(entry);
}

function isProtectedDataDenial(entry: ShopifyGraphqlError): boolean {
  if (/protected customer data|not approved to access/i.test(entry.message ?? '')) {
    return true;
  }
  return String(entry.extensions?.documentation ?? '').includes(
    'protected-customer-data'
  );
}

function findWithheldMutationResult({
  query,
  errors,
  primaryPaths,
}: {
  query: string;
  errors: ShopifyGraphqlError[];
  primaryPaths: string[];
}): ShopifyGraphqlError | undefined {
  if (!/^\s*mutation\b/.test(query)) {
    return undefined;
  }
  return errors.find((entry) => {
    const path = (entry.path ?? []).map((segment) => String(segment));
    return (
      path.length >= 2 &&
      primaryPaths.includes(path.join('.')) &&
      isProtectedDataDenial(entry)
    );
  });
}

function toWithheldResultError(entry: ShopifyGraphqlError): Error {
  const path = (entry.path ?? []).map((segment) => String(segment)).join('.');
  return new Error(
    `Shopify APPLIED this change, but withheld the returned record (${path}) because this app is not approved for protected customer data. Do not repeat the operation: it already took effect. To get the result back, grant the app protected customer data access (Partner Dashboard > App > API access > Protected customer data). Shopify said: ${entry.message ?? ''}`.trim()
  );
}

function toProtectedDataError(entry: ShopifyGraphqlError): Error {
  return new Error(
    `Shopify withheld protected customer data: ${entry.message ?? ''} The app needs protected customer data access (Partner Dashboard > App > API access > Protected customer data, including the name, email, phone and address fields it reads). Adding Admin API scopes or reinstalling the app will not fix this.`
  );
}

function isPrimaryPath({
  path,
  primaryPaths,
}: {
  path: (string | number)[];
  primaryPaths: string[];
}): boolean {
  if (path.length === 2 && CONNECTION_LIST_FIELDS.includes(String(path[1]))) {
    return true;
  }
  const joined = path.map((segment) => String(segment)).join('.');
  return primaryPaths.some(
    (primary) =>
      joined === primary ||
      CONNECTION_LIST_FIELDS.some((field) => joined === `${primary}.${field}`)
  );
}

function toGraphqlError(errors: ShopifyGraphqlError[]): Error {
  if (errors.length === 0) {
    return new Error('Shopify returned no data and no error details.');
  }
  const protectedData = errors.find(isProtectedDataDenial);
  if (protectedData) {
    return toProtectedDataError(protectedData);
  }
  const denied = errors.find(
    (entry) => entry.extensions?.code === 'ACCESS_DENIED'
  );
  if (denied) {
    const scope = readRequiredScope(denied);
    const scopeText = scope ? `the "${scope}" access scope` : 'an access scope';
    return new Error(
      `Shopify denied access: the app token is missing ${scopeText}. Add it to your custom app's Admin API scopes and reinstall the app, then paste the new token into the connection. Shopify said: ${denied.message ?? ''}`.trim()
    );
  }
  const messages = errors.map((entry) => {
    const path = (entry.path ?? []).join('.');
    return path ? `${path}: ${entry.message ?? ''}` : entry.message ?? '';
  });
  return new Error(`Shopify GraphQL error: ${messages.join('; ')}`);
}

function readRequiredScope(entry: ShopifyGraphqlError): string | null {
  const candidates = [entry.extensions?.requiredAccess, entry.message];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const match = candidate.match(/`?([a-z_]+)`? access scope/i);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function throwOnUserErrors({
  data,
  toleratedCodes,
}: {
  data: unknown;
  toleratedCodes: string[];
}): void {
  if (!isRecord(data)) {
    return;
  }
  const problems: string[] = [];
  for (const payload of Object.values(data)) {
    if (!isRecord(payload)) {
      continue;
    }
    for (const [key, value] of Object.entries(payload)) {
      if (key !== 'userErrors' && !key.endsWith('UserErrors')) {
        continue;
      }
      if (!Array.isArray(value)) {
        continue;
      }
      for (const item of value) {
        if (isRecord(item) && typeof item['code'] === 'string' && toleratedCodes.includes(item['code'])) {
          continue;
        }
        problems.push(describeUserError(item));
      }
    }
  }
  if (problems.length > 0) {
    throw new Error(`Shopify rejected the request: ${problems.join('; ')}`);
  }
}

function describeUserError(item: unknown): string {
  if (!isRecord(item)) {
    return String(item);
  }
  const field = Array.isArray(item['field'])
    ? item['field'].map((part: unknown) => String(part)).join('.')
    : '';
  const message =
    typeof item['message'] === 'string' ? item['message'] : 'Unknown error';
  const code = typeof item['code'] === 'string' ? ` (${item['code']})` : '';
  return field ? `${field}: ${message}${code}` : `${message}${code}`;
}

function toHttpError(error: Error): Error {
  if (!(error instanceof HttpError)) {
    return error;
  }
  const status = error.response.status;
  const detail = JSON.stringify(error.response.body ?? '');
  if (status === 401) {
    return new Error(
      `Shopify returned 401: the Admin API access token is invalid or expired. Reconnect with a valid token. ${detail}`
    );
  }
  if (status === 402) {
    return new Error(
      `Shopify returned 402: the shop is frozen or its plan does not allow this request. ${detail}`
    );
  }
  if (status === 403) {
    return new Error(
      `Shopify returned 403: the app is not allowed to perform this request. Check the custom app's Admin API scopes and that it is still installed. ${detail}`
    );
  }
  if (status === 404) {
    return new Error(
      `Shopify returned 404: the shop was not found. Check the shop name in the connection. ${detail}`
    );
  }
  if (status === 423) {
    return new Error(`Shopify returned 423: the shop is locked. ${detail}`);
  }
  if (status === 429) {
    return new Error(
      `Shopify returned 429: rate limit reached. Wait a few seconds and retry. ${detail}`
    );
  }
  if (status >= 500) {
    return new Error(
      `Shopify returned ${status}: a Shopify server error. Retry later. ${detail}`
    );
  }
  return new Error(`Shopify returned ${status}: ${detail}`);
}

function toGid({ type, id, query }: ToGidParams): string {
  const value = String(id).trim();
  if (value.startsWith('gid://')) {
    return value;
  }
  if (/^\d+$/.test(value)) {
    return `gid://shopify/${type}/${value}${query ? `?${query}` : ''}`;
  }
  return value;
}

function toOpaqueGid({ type, id }: { type: string; id: string }): string {
  const value = id.trim();
  if (value.length === 0 || value.startsWith('gid://')) {
    return value;
  }
  return `gid://shopify/${type}/${value}`;
}

function resolveIdempotencyKey(value: string | undefined | null): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : randomUUID();
}

function readFirst({
  value,
  max,
}: {
  value: number | undefined | null;
  max: number;
}): number {
  if (value === undefined || value === null) {
    return Math.min(50, max);
  }
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new Error(`Page size must be a whole number between 1 and ${max}.`);
  }
  return value;
}

function nonEmpty(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readStringList(value: unknown): string[] | undefined {
  const list = readArray(value);
  if (!list) {
    return undefined;
  }
  return list
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0);
}

function readRecords(value: unknown): Record<string, unknown>[] {
  const list = readArray(value);
  if (!list) {
    return [];
  }
  return list.filter(isRecord);
}

function readArray(value: unknown): unknown[] | undefined {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBooleanChoice(value: unknown): boolean | undefined {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}

function compact(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function money(bag: GqlMoneyBag | null | undefined): string | null {
  return bag?.shopMoney?.amount ?? null;
}

function presentmentMoney(bag: GqlMoneyBag | null | undefined): string | null {
  return bag?.presentmentMoney?.amount ?? null;
}

function presentmentCurrency(bag: GqlMoneyBag | null | undefined): string | null {
  return bag?.presentmentMoney?.currencyCode ?? null;
}

function joinTags(tags: string[] | null | undefined): string | null {
  return Array.isArray(tags) ? tags.join(', ') : null;
}

function toPage<TNode, TItem>({
  connection,
  map,
  redactedFields,
}: {
  connection: GqlConnection<TNode> | null | undefined;
  map: (node: TNode) => TItem;
  redactedFields: string[];
}): ShopifyPage<TItem> {
  const items = (connection?.nodes ?? []).map(map);
  return {
    items,
    count: items.length,
    has_next_page: connection?.pageInfo?.hasNextPage ?? false,
    end_cursor: connection?.pageInfo?.endCursor ?? null,
    redacted_fields: redactedFields,
  };
}

function mapAddress(address: GqlMailingAddress | null | undefined): FlatAddress {
  return {
    id: address?.id ?? null,
    first_name: address?.firstName ?? null,
    last_name: address?.lastName ?? null,
    name: address?.name ?? null,
    company: address?.company ?? null,
    address1: address?.address1 ?? null,
    address2: address?.address2 ?? null,
    city: address?.city ?? null,
    province: address?.province ?? null,
    province_code: address?.provinceCode ?? null,
    country: address?.country ?? null,
    country_code: address?.countryCodeV2 ?? null,
    zip: address?.zip ?? null,
    phone: address?.phone ?? null,
  };
}

function prefixAddress({
  prefix,
  address,
}: {
  prefix: string;
  address: GqlMailingAddress | null | undefined;
}): Record<string, string | null> {
  const flat = mapAddress(address);
  return {
    [`${prefix}_name`]: flat.name,
    [`${prefix}_company`]: flat.company,
    [`${prefix}_address1`]: flat.address1,
    [`${prefix}_address2`]: flat.address2,
    [`${prefix}_city`]: flat.city,
    [`${prefix}_province_code`]: flat.province_code,
    [`${prefix}_country_code`]: flat.country_code,
    [`${prefix}_zip`]: flat.zip,
    [`${prefix}_phone`]: flat.phone,
  };
}

function mapOrderSummary(order: GqlOrder) {
  return {
    id: order.id,
    legacy_resource_id: order.legacyResourceId ?? null,
    name: order.name ?? null,
    created_at: order.createdAt ?? null,
    updated_at: order.updatedAt ?? null,
    processed_at: order.processedAt ?? null,
    closed: order.closed ?? null,
    closed_at: order.closedAt ?? null,
    cancelled_at: order.cancelledAt ?? null,
    cancel_reason: order.cancelReason ?? null,
    financial_status: order.displayFinancialStatus ?? null,
    fulfillment_status: order.displayFulfillmentStatus ?? null,
    test: order.test ?? null,
    email: order.email ?? null,
    phone: order.phone ?? null,
    note: order.note ?? null,
    tags: joinTags(order.tags),
    po_number: order.poNumber ?? null,
    source_name: order.sourceName ?? null,
    currency_code: order.currencyCode ?? null,
    subtotal_price: money(order.subtotalPriceSet),
    total_price: money(order.totalPriceSet),
    total_tax: money(order.totalTaxSet),
    total_discounts: money(order.totalDiscountsSet),
    total_shipping: money(order.totalShippingPriceSet),
    total_refunded: money(order.totalRefundedSet),
    total_outstanding: money(order.totalOutstandingSet),
    current_total_price: money(order.currentTotalPriceSet),
    customer_id: order.customer?.id ?? null,
    customer_name: order.customer?.displayName ?? null,
    customer_email: order.customer?.defaultEmailAddress?.emailAddress ?? null,
  };
}

function mapOrderDetail(order: GqlOrder) {
  return {
    ...mapOrderSummary(order),
    number: order.number ?? null,
    confirmed: order.confirmed ?? null,
    capturable: order.capturable ?? null,
    refundable: order.refundable ?? null,
    fully_paid: order.fullyPaid ?? null,
    unpaid: order.unpaid ?? null,
    can_mark_as_paid: order.canMarkAsPaid ?? null,
    fulfillments_count: order.fulfillmentsCount?.count ?? null,
    transactions_count: order.transactionsCount?.count ?? null,
    discount_codes: joinTags(order.discountCodes),
    payment_gateway_names: joinTags(order.paymentGatewayNames),
    shipping_line_title: order.shippingLine?.title ?? null,
    shipping_line_price: money(order.shippingLine?.originalPriceSet),
    ...prefixAddress({ prefix: 'shipping', address: order.shippingAddress }),
    ...prefixAddress({ prefix: 'billing', address: order.billingAddress }),
    line_items: (order.lineItems?.nodes ?? []).map((item) => ({
      id: item.id,
      name: item.name ?? null,
      title: item.title ?? null,
      sku: item.sku ?? null,
      variant_title: item.variantTitle ?? null,
      vendor: item.vendor ?? null,
      quantity: item.quantity ?? null,
      current_quantity: item.currentQuantity ?? null,
      refundable_quantity: item.refundableQuantity ?? null,
      unfulfilled_quantity: item.unfulfilledQuantity ?? null,
      requires_shipping: item.requiresShipping ?? null,
      taxable: item.taxable ?? null,
      original_unit_price: money(item.originalUnitPriceSet),
      discounted_total: money(item.discountedTotalSet),
      variant_id: item.variant?.id ?? null,
      product_id: item.product?.id ?? null,
    })),
    line_items_has_more: order.lineItems?.pageInfo?.hasNextPage ?? false,
  };
}

function mapTransaction(transaction: GqlTransaction) {
  return {
    id: transaction.id,
    kind: transaction.kind ?? null,
    status: transaction.status ?? null,
    gateway: transaction.gateway ?? null,
    formatted_gateway: transaction.formattedGateway ?? null,
    test: transaction.test ?? null,
    amount: money(transaction.amountSet),
    currency_code: transaction.amountSet?.shopMoney?.currencyCode ?? null,
    total_unsettled: money(transaction.totalUnsettledSet),
    maximum_refundable: transaction.maximumRefundableV2?.amount ?? null,
    manually_capturable: transaction.manuallyCapturable ?? null,
    multi_capturable: transaction.multiCapturable ?? null,
    authorization_expires_at: transaction.authorizationExpiresAt ?? null,
    error_code: transaction.errorCode ?? null,
    payment_id: transaction.paymentId ?? null,
    parent_transaction_id: transaction.parentTransaction?.id ?? null,
    order_id: transaction.order?.id ?? null,
    order_name: transaction.order?.name ?? null,
    created_at: transaction.createdAt ?? null,
    processed_at: transaction.processedAt ?? null,
  };
}

function mapRefund(refund: GqlRefund) {
  return {
    id: refund.id,
    legacy_resource_id: refund.legacyResourceId ?? null,
    note: refund.note ?? null,
    created_at: refund.createdAt ?? null,
    processed_at: refund.processedAt ?? null,
    updated_at: refund.updatedAt ?? null,
    total_refunded: money(refund.totalRefundedSet),
    currency_code: refund.totalRefundedSet?.shopMoney?.currencyCode ?? null,
    order_id: refund.order?.id ?? null,
    order_name: refund.order?.name ?? null,
    refund_line_items: (refund.refundLineItems?.nodes ?? []).map((item) => ({
      line_item_id: item.lineItem?.id ?? null,
      title: item.lineItem?.title ?? null,
      sku: item.lineItem?.sku ?? null,
      quantity: item.quantity ?? null,
      restock_type: item.restockType ?? null,
      restocked: item.restocked ?? null,
      subtotal: money(item.subtotalSet),
      total_tax: money(item.totalTaxSet),
    })),
    transactions: (refund.transactions?.nodes ?? []).map((item) => ({
      id: item.id,
      kind: item.kind ?? null,
      status: item.status ?? null,
      gateway: item.gateway ?? null,
      amount: money(item.amountSet),
    })),
  };
}

function mapRefundSummary(refund: GqlRefund) {
  return {
    id: refund.id,
    legacy_resource_id: refund.legacyResourceId ?? null,
    note: refund.note ?? null,
    created_at: refund.createdAt ?? null,
    processed_at: refund.processedAt ?? null,
    updated_at: refund.updatedAt ?? null,
    total_refunded: money(refund.totalRefundedSet),
    currency_code: refund.totalRefundedSet?.shopMoney?.currencyCode ?? null,
  };
}

function mapDraftOrderSummary(draft: GqlDraftOrder) {
  return {
    id: draft.id,
    legacy_resource_id: draft.legacyResourceId ?? null,
    name: draft.name ?? null,
    status: draft.status ?? null,
    created_at: draft.createdAt ?? null,
    updated_at: draft.updatedAt ?? null,
    completed_at: draft.completedAt ?? null,
    invoice_url: draft.invoiceUrl ?? null,
    invoice_sent_at: draft.invoiceSentAt ?? null,
    email: draft.email ?? null,
    phone: draft.phone ?? null,
    note: draft.note2 ?? null,
    tags: joinTags(draft.tags),
    po_number: draft.poNumber ?? null,
    ready: draft.ready ?? null,
    currency_code: draft.currencyCode ?? null,
    subtotal_price: money(draft.subtotalPriceSet),
    total_price: money(draft.totalPriceSet),
    total_tax: money(draft.totalTaxSet),
    total_discounts: money(draft.totalDiscountsSet),
    total_shipping: money(draft.totalShippingPriceSet),
    customer_id: draft.customer?.id ?? null,
    customer_name: draft.customer?.displayName ?? null,
    order_id: draft.order?.id ?? null,
    order_name: draft.order?.name ?? null,
  };
}

function mapDraftOrderDetail(draft: GqlDraftOrder) {
  return {
    ...mapDraftOrderSummary(draft),
    reserve_inventory_until: draft.reserveInventoryUntil ?? null,
    tax_exempt: draft.taxExempt ?? null,
    taxes_included: draft.taxesIncluded ?? null,
    discount_codes: joinTags(draft.discountCodes),
    applied_discount_title: draft.appliedDiscount?.title ?? null,
    applied_discount_value: draft.appliedDiscount?.value ?? null,
    applied_discount_value_type: draft.appliedDiscount?.valueType ?? null,
    applied_discount_amount: money(draft.appliedDiscount?.amountSet),
    payment_terms_id: draft.paymentTerms?.id ?? null,
    payment_terms_name: draft.paymentTerms?.paymentTermsName ?? null,
    payment_terms_type: draft.paymentTerms?.paymentTermsType ?? null,
    payment_terms_due_in_days: draft.paymentTerms?.dueInDays ?? null,
    shipping_line_title: draft.shippingLine?.title ?? null,
    shipping_line_price: money(draft.shippingLine?.originalPriceSet),
    ...prefixAddress({ prefix: 'shipping', address: draft.shippingAddress }),
    line_items: (draft.lineItems?.nodes ?? []).map((item) => ({
      id: item.id,
      name: item.name ?? null,
      title: item.title ?? null,
      sku: item.sku ?? null,
      quantity: item.quantity ?? null,
      custom: item.custom ?? null,
      original_unit_price: money(item.originalUnitPriceSet),
      discounted_total: money(item.discountedTotalSet),
      variant_id: item.variant?.id ?? null,
    })),
    line_items_has_more: draft.lineItems?.pageInfo?.hasNextPage ?? false,
  };
}

function mapCustomer(customer: GqlCustomer) {
  const email = customer.defaultEmailAddress;
  const address = customer.defaultAddress;
  return {
    id: customer.id,
    legacy_resource_id: customer.legacyResourceId ?? null,
    display_name: customer.displayName ?? null,
    first_name: customer.firstName ?? null,
    last_name: customer.lastName ?? null,
    email: email?.emailAddress ?? null,
    email_marketing_state: email?.marketingState ?? null,
    email_marketing_opt_in_level: email?.marketingOptInLevel ?? null,
    email_marketing_updated_at: email?.marketingUpdatedAt ?? null,
    phone: customer.defaultPhoneNumber?.phoneNumber ?? null,
    note: customer.note ?? null,
    tags: joinTags(customer.tags),
    state: customer.state ?? null,
    verified_email: customer.verifiedEmail ?? null,
    tax_exempt: customer.taxExempt ?? null,
    locale: customer.locale ?? null,
    number_of_orders: customer.numberOfOrders ?? null,
    amount_spent: customer.amountSpent?.amount ?? null,
    amount_spent_currency: customer.amountSpent?.currencyCode ?? null,
    can_delete: customer.canDelete ?? null,
    last_order_id: customer.lastOrder?.id ?? null,
    last_order_name: customer.lastOrder?.name ?? null,
    default_address_id: address?.id ?? null,
    ...prefixAddress({ prefix: 'default_address', address }),
    created_at: customer.createdAt ?? null,
    updated_at: customer.updatedAt ?? null,
  };
}

function mapAbandonedCheckout(checkout: GqlAbandonedCheckout) {
  return {
    id: checkout.id,
    name: checkout.name ?? null,
    created_at: checkout.createdAt ?? null,
    updated_at: checkout.updatedAt ?? null,
    completed_at: checkout.completedAt ?? null,
    recovery_url: checkout.abandonedCheckoutUrl ?? null,
    note: checkout.note ?? null,
    discount_codes: joinTags(checkout.discountCodes),
    taxes_included: checkout.taxesIncluded ?? null,
    currency_code: checkout.totalPriceSet?.shopMoney?.currencyCode ?? null,
    subtotal_price: money(checkout.subtotalPriceSet),
    total_price: money(checkout.totalPriceSet),
    customer_id: checkout.customer?.id ?? null,
    customer_name: checkout.customer?.displayName ?? null,
    customer_email: checkout.customer?.defaultEmailAddress?.emailAddress ?? null,
    shipping_country_code: checkout.shippingAddress?.countryCodeV2 ?? null,
  };
}

function mapAbandonment(abandonment: GqlAbandonment | null) {
  return {
    id: abandonment?.id ?? null,
    abandonment_type: abandonment?.abandonmentType ?? null,
    most_recent_step: abandonment?.mostRecentStep ?? null,
    created_at: abandonment?.createdAt ?? null,
    email_state: abandonment?.emailState ?? null,
    email_sent_at: abandonment?.emailSentAt ?? null,
    cart_url: abandonment?.cartUrl ?? null,
    inventory_available: abandonment?.inventoryAvailable ?? null,
    is_from_online_store: abandonment?.isFromOnlineStore ?? null,
    customer_has_no_order_since_abandonment:
      abandonment?.customerHasNoOrderSinceAbandonment ?? null,
    last_checkout_abandonment_date: abandonment?.lastCheckoutAbandonmentDate ?? null,
    customer_id: abandonment?.customer?.id ?? null,
    customer_name: abandonment?.customer?.displayName ?? null,
    customer_email: abandonment?.customer?.defaultEmailAddress?.emailAddress ?? null,
    abandoned_checkout_id: abandonment?.abandonedCheckoutPayload?.id ?? null,
    abandoned_checkout_name: abandonment?.abandonedCheckoutPayload?.name ?? null,
    abandoned_checkout_url:
      abandonment?.abandonedCheckoutPayload?.abandonedCheckoutUrl ?? null,
    abandoned_checkout_total_price: money(
      abandonment?.abandonedCheckoutPayload?.totalPriceSet
    ),
  };
}

function buildMailingAddress(props: AddressProps): Record<string, unknown> {
  return compact({
    firstName: nonEmpty(props.first_name),
    lastName: nonEmpty(props.last_name),
    company: nonEmpty(props.company),
    address1: nonEmpty(props.address1),
    address2: nonEmpty(props.address2),
    city: nonEmpty(props.city),
    provinceCode: nonEmpty(props.province_code),
    countryCode: nonEmpty(props.country_code)?.toUpperCase(),
    zip: nonEmpty(props.zip),
    phone: nonEmpty(props.phone),
  });
}

function addressProps() {
  return {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name on the address.',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name on the address.',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Company name on the address.',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Street address, for example "150 Elgin Street".',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Apartment, suite or unit, for example "Suite 800".',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City, for example "Ottawa".',
      required: false,
    }),
    province_code: Property.ShortText({
      displayName: 'Province / State Code',
      description: 'Region code, for example "ON" or "CA".',
      required: false,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter ISO country code, for example "CA" or "US".',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Postal or ZIP code, for example "K2P 1L4".',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number in E.164 format, for example "+16135551111".',
      required: false,
    }),
  };
}

function buildRefundLineItems(value: unknown): Record<string, unknown>[] | undefined {
  const items = readRecords(value).map((item) => {
    const lineItemId = readText(item['line_item_id']);
    const quantity = readNumber(item['quantity']);
    if (!lineItemId || quantity === undefined) {
      throw new Error('Every refund line item needs a line_item_id and a quantity.');
    }
    const locationId = readText(item['location_id']);
    return compact({
      lineItemId: toGid({ type: 'LineItem', id: lineItemId }),
      quantity,
      restockType: readText(item['restock_type']) ?? 'NO_RESTOCK',
      locationId: locationId ? toGid({ type: 'Location', id: locationId }) : undefined,
    });
  });
  return items.length > 0 ? items : undefined;
}

function refundLineItemsProp() {
  return Property.Array({
    displayName: 'Line Items to Refund',
    description: 'Line items and quantities to refund. Line item ids come from get_order.',
    required: false,
    properties: {
      line_item_id: Property.ShortText({
        displayName: 'Line Item ID',
        description: 'Line item id, numeric or "gid://shopify/LineItem/…".',
        required: true,
      }),
      quantity: Property.Number({
        displayName: 'Quantity',
        description: 'How many units of this line item to refund.',
        required: true,
      }),
      restock_type: Property.StaticDropdown({
        displayName: 'Restock Type',
        description: 'What happens to the stock. Defaults to no restock.',
        required: false,
        options: {
          options: [
            { label: 'No restock', value: 'NO_RESTOCK' },
            { label: 'Return (item was delivered and returned)', value: 'RETURN' },
            { label: 'Cancel (item was not shipped)', value: 'CANCEL' },
          ],
        },
      }),
      location_id: Property.ShortText({
        displayName: 'Restock Location ID',
        description: 'Location to restock at, numeric or "gid://shopify/Location/…". Only used when restocking.',
        required: false,
      }),
    },
  });
}

function buildDraftLineItems({
  value,
  currency,
}: {
  value: unknown;
  currency: string | undefined;
}): Record<string, unknown>[] {
  return readRecords(value).map((item) => {
    const variantId = readText(item['variant_id']);
    const title = readText(item['title']);
    const quantity = readNumber(item['quantity']);
    const price = readNumber(item['price']);
    if (quantity === undefined || quantity < 1) {
      throw new Error('Every line item needs a quantity of at least 1.');
    }
    if (!variantId && (!title || price === undefined)) {
      throw new Error('Every line item needs a variant_id, or a title and a price for a custom item.');
    }
    if (price !== undefined && !currency) {
      throw new Error('Set "currency" (for example "USD") when giving a unit price.');
    }
    const unitPrice =
      price !== undefined && currency ? { amount: String(price), currencyCode: currency } : undefined;
    if (variantId) {
      return compact({
        variantId: toGid({ type: 'ProductVariant', id: variantId }),
        quantity,
        priceOverride: unitPrice,
      });
    }
    return compact({
      title,
      quantity,
      sku: readText(item['sku']),
      originalUnitPriceWithCurrency: unitPrice,
    });
  });
}

function draftLineItemsProp({
  required,
  description,
}: {
  required: boolean;
  description: string;
}) {
  return Property.Array({
    displayName: 'Line Items',
    description,
    required,
    properties: {
      variant_id: Property.ShortText({
        displayName: 'Variant ID',
        description: 'Product variant id, for example "39072856" or "gid://shopify/ProductVariant/39072856".',
        required: false,
      }),
      title: Property.ShortText({
        displayName: 'Title',
        description: 'Title of a custom item (no variant), for example "Custom engraving".',
        required: false,
      }),
      quantity: Property.Number({
        displayName: 'Quantity',
        description: 'How many units, at least 1.',
        required: true,
      }),
      price: Property.Number({
        displayName: 'Unit Price',
        description: 'Unit price in the draft currency, for example 19.99. Required for custom items. On a variant line it replaces the catalog price for this draft only (sent as a price override); leave empty to use the variant price.',
        required: false,
      }),
      sku: Property.ShortText({
        displayName: 'SKU',
        description: 'Optional SKU for a custom item.',
        required: false,
      }),
    },
  });
}

function firstProp({ max }: { max: number }) {
  return Property.Number({
    displayName: 'Page Size',
    description: `How many records to return, 1 to ${max}. Defaults to ${Math.min(50, max)}.`,
    required: false,
    defaultValue: Math.min(50, max),
  });
}

function afterProp() {
  return Property.ShortText({
    displayName: 'Cursor',
    description:
      'The end_cursor from the previous page. Leave empty for the first page; pass it only while has_next_page is true.',
    required: false,
  });
}

function reverseProp() {
  return Property.Checkbox({
    displayName: 'Reverse Order',
    description: 'Return results in reverse sort order (for example newest first).',
    required: false,
    defaultValue: false,
  });
}

function searchQueryProp(description: string) {
  return Property.ShortText({
    displayName: 'Search Query',
    description,
    required: false,
  });
}

function booleanChoiceProp({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

function idempotencyKeyProp() {
  return Property.ShortText({
    displayName: 'Idempotency Key',
    description:
      'A unique key for this operation, for example a UUID such as "3f1c2a9e-6b1d-4c8e-9a51-2f7d0e4b8c10". Generate your own key on the first call and pass the same key again when retrying after a timeout or error, so Shopify does not repeat the operation. If left empty a key is generated; it is returned as idempotency_key and included in any error message.',
    required: false,
  });
}

function mapProductSummary(product: GqlProduct) {
  return {
    id: product.id,
    legacy_resource_id: product.legacyResourceId ?? null,
    title: product.title ?? null,
    handle: product.handle ?? null,
    status: product.status ?? null,
    vendor: product.vendor ?? null,
    product_type: product.productType ?? null,
    tags: joinTags(product.tags),
    created_at: product.createdAt ?? null,
    updated_at: product.updatedAt ?? null,
    published_at: product.publishedAt ?? null,
    total_inventory: product.totalInventory ?? null,
    tracks_inventory: product.tracksInventory ?? null,
    has_only_default_variant: product.hasOnlyDefaultVariant ?? null,
    variants_count: product.variantsCount?.count ?? null,
    media_count: product.mediaCount?.count ?? null,
    min_price: product.priceRangeV2?.minVariantPrice?.amount ?? null,
    max_price: product.priceRangeV2?.maxVariantPrice?.amount ?? null,
    currency_code: product.priceRangeV2?.minVariantPrice?.currencyCode ?? null,
    featured_media_id: product.featuredMedia?.id ?? null,
    featured_image_url: product.featuredMedia?.preview?.image?.url ?? null,
    category_id: product.category?.id ?? null,
    category_name: product.category?.fullName ?? null,
  };
}

function mapProductDetail(product: GqlProduct) {
  return {
    ...mapProductSummary(product),
    description_html: product.descriptionHtml ?? null,
    template_suffix: product.templateSuffix ?? null,
    seo_title: product.seo?.title ?? null,
    seo_description: product.seo?.description ?? null,
    is_gift_card: product.isGiftCard ?? null,
    requires_selling_plan: product.requiresSellingPlan ?? null,
    options: (product.options ?? []).map(mapProductOption),
    variants: (product.variants?.nodes ?? []).map(mapVariant),
    variants_has_more: product.variants?.pageInfo?.hasNextPage ?? false,
    media: (product.media?.nodes ?? []).map(mapMedia),
    media_has_more: product.media?.pageInfo?.hasNextPage ?? false,
  };
}

function mapProductOption(option: GqlProductOption) {
  return {
    id: option.id,
    name: option.name ?? null,
    position: option.position ?? null,
    values: (option.optionValues ?? []).map((value) => ({
      id: value.id,
      name: value.name ?? null,
      has_variants: value.hasVariants ?? null,
    })),
  };
}

function mapVariant(variant: GqlVariant) {
  return {
    id: variant.id,
    legacy_resource_id: variant.legacyResourceId ?? null,
    title: variant.title ?? null,
    display_name: variant.displayName ?? null,
    sku: variant.sku ?? null,
    barcode: variant.barcode ?? null,
    price: variant.price ?? null,
    compare_at_price: variant.compareAtPrice ?? null,
    position: variant.position ?? null,
    inventory_quantity: variant.inventoryQuantity ?? null,
    inventory_policy: variant.inventoryPolicy ?? null,
    available_for_sale: variant.availableForSale ?? null,
    taxable: variant.taxable ?? null,
    selected_options: (variant.selectedOptions ?? []).map((option) => ({
      name: option.name ?? null,
      value: option.value ?? null,
    })),
    inventory_item_id: variant.inventoryItem?.id ?? null,
    inventory_tracked: variant.inventoryItem?.tracked ?? null,
    requires_shipping: variant.inventoryItem?.requiresShipping ?? null,
    product_id: variant.product?.id ?? null,
    product_title: variant.product?.title ?? null,
    created_at: variant.createdAt ?? null,
    updated_at: variant.updatedAt ?? null,
  };
}

function mapMedia(media: GqlMedia) {
  const errors = (media.mediaErrors ?? [])
    .map((error) => error.message ?? error.code ?? '')
    .filter((message) => message.length > 0);
  return {
    id: media.id ?? null,
    alt: media.alt ?? null,
    media_content_type: media.mediaContentType ?? null,
    status: media.status ?? null,
    image_url: media.image?.url ?? null,
    width: media.image?.width ?? null,
    height: media.image?.height ?? null,
    mime_type: media.mimeType ?? null,
    preview_url: media.preview?.image?.url ?? null,
    external_url: media.originUrl ?? null,
    filename: media.filename ?? null,
    errors: errors.length > 0 ? errors.join('; ') : null,
  };
}

function mapCollectionSummary(collection: GqlCollection) {
  return {
    id: collection.id,
    legacy_resource_id: collection.legacyResourceId ?? null,
    title: collection.title ?? null,
    handle: collection.handle ?? null,
    sort_order: collection.sortOrder ?? null,
    updated_at: collection.updatedAt ?? null,
    products_count: collection.productsCount?.count ?? null,
    image_url: collection.image?.url ?? null,
    image_alt: collection.image?.altText ?? null,
  };
}

function mapCollection(collection: GqlCollection) {
  return {
    ...mapCollectionSummary(collection),
    description_html: collection.descriptionHtml ?? null,
    template_suffix: collection.templateSuffix ?? null,
    seo_title: collection.seo?.title ?? null,
    seo_description: collection.seo?.description ?? null,
    sources: (collection.sources ?? []).map((source) => {
      const selections = source.inclusion?.selections;
      return {
        id: source.id,
        title: source.title ?? null,
        type: source.__typename === 'CollectionConditionsSource' ? 'conditions' : 'sub_collections',
        shareable: source.shareable ?? null,
        app_id: source.app?.id ?? null,
        target_type: source.targetType ?? null,
        match_type: source.inclusion?.matchType ?? null,
        conditions: (source.inclusion?.conditions ?? []).map(mapCollectionCondition),
        selected_products: (selections?.nodes ?? []).map((selection) => ({
          product_id: selection.product?.id ?? null,
          product_title: selection.product?.title ?? null,
          variant_ids: selection.variantIds ?? null,
        })),
        selected_products_count: selections?.nodes?.length ?? 0,
        selected_products_truncated: selections?.pageInfo?.hasNextPage ?? false,
      };
    }),
  };
}

function mapCollectionCondition(condition: GqlCollectionCondition) {
  const relation =
    condition.tagRelation ??
    condition.titleRelation ??
    condition.typeRelation ??
    condition.vendorRelation ??
    condition.variantTitleRelation ??
    condition.priceRelation ??
    condition.compareAtPriceRelation ??
    condition.inventoryRelation ??
    null;
  const textValues =
    condition.tagValues ??
    condition.titleValues ??
    condition.typeValues ??
    condition.vendorValues ??
    condition.variantTitleValues;
  const money = condition.priceValue ?? condition.compareAtPriceValue;
  const values = textValues
    ? textValues
    : money?.amount !== undefined && money.amount !== null
      ? [money.amount]
      : condition.inventoryValue !== undefined && condition.inventoryValue !== null
        ? [String(condition.inventoryValue)]
        : [];
  return {
    id: condition.id,
    kind: (condition.__typename ?? '').replace('CollectionSourceInclusionCondition', ''),
    relation,
    values,
    currency_code: money?.currencyCode ?? null,
  };
}

function findConditionsSource({
  collection,
  sourceId,
}: {
  collection: GqlCollection;
  sourceId: string | undefined;
}): GqlCollectionSource | undefined {
  if (sourceId !== undefined) {
    return findExplicitConditionsSource({ collection, sourceId });
  }
  return editableConditionsSources(collection)[0];
}

function findExplicitConditionsSource({
  collection,
  sourceId,
}: {
  collection: GqlCollection;
  sourceId: string;
}): GqlCollectionSource {
  const sourceGid = toGid({ type: 'CollectionConditionsSource', id: sourceId });
  const match = conditionsSources(collection).find((source) => source.id === sourceGid);
  if (!match) {
    throw new Error(
      `Source ${sourceId} is not a conditions source of collection ${collection.id}. Read the collection sources with get_collection.`
    );
  }
  if (match.shareable === true) {
    throw new Error(
      `Source ${sourceId} ("${match.title ?? ''}") is shared with other collections, so changing its picks would change those collections too. Pick a non-shared source from get_collection, or omit source_id.`
    );
  }
  return match;
}

function conditionsSources(collection: GqlCollection): GqlCollectionSource[] {
  return (collection.sources ?? []).filter((source) => source.__typename === 'CollectionConditionsSource');
}

function editableConditionsSources(collection: GqlCollection): GqlCollectionSource[] {
  return conditionsSources(collection).filter((source) => source.shareable !== true);
}

function sharedConditionsSources(collection: GqlCollection): GqlCollectionSource[] {
  return conditionsSources(collection).filter((source) => source.shareable === true);
}

function mapInventoryItem(item: GqlInventoryItem) {
  const variant = item.variants?.nodes?.[0];
  return {
    id: item.id,
    legacy_resource_id: item.legacyResourceId ?? null,
    sku: item.sku ?? null,
    tracked: item.tracked ?? null,
    requires_shipping: item.requiresShipping ?? null,
    unit_cost: item.unitCost?.amount ?? null,
    unit_cost_currency: item.unitCost?.currencyCode ?? null,
    country_code_of_origin: item.countryCodeOfOrigin ?? null,
    province_code_of_origin: item.provinceCodeOfOrigin ?? null,
    harmonized_system_code: item.harmonizedSystemCode ?? null,
    weight_value: item.measurement?.weight?.value ?? null,
    weight_unit: item.measurement?.weight?.unit ?? null,
    locations_count: item.locationsCount?.count ?? null,
    variant_id: variant?.id ?? null,
    variant_title: variant?.displayName ?? null,
    product_id: variant?.product?.id ?? null,
    product_title: variant?.product?.title ?? null,
    created_at: item.createdAt ?? null,
    updated_at: item.updatedAt ?? null,
  };
}

function mapInventoryLevel(level: GqlInventoryLevel) {
  const quantity = (name: string): number | null =>
    (level.quantities ?? []).find((entry) => entry.name === name)?.quantity ?? null;
  return {
    id: level.id,
    is_active: level.isActive ?? null,
    can_deactivate: level.canDeactivate ?? null,
    deactivation_alert: level.deactivationAlert ?? null,
    inventory_item_id: level.item?.id ?? null,
    sku: level.item?.sku ?? null,
    location_id: level.location?.id ?? null,
    location_name: level.location?.name ?? null,
    available: quantity('available'),
    on_hand: quantity('on_hand'),
    committed: quantity('committed'),
    incoming: quantity('incoming'),
    reserved: quantity('reserved'),
    damaged: quantity('damaged'),
    safety_stock: quantity('safety_stock'),
    quality_control: quantity('quality_control'),
    updated_at: level.updatedAt ?? null,
  };
}

function mapAdjustmentGroup(group: GqlInventoryAdjustmentGroup | null | undefined) {
  return {
    adjustment_group_id: group?.id ?? null,
    created_at: group?.createdAt ?? null,
    reason: group?.reason ?? null,
    reference_document_uri: group?.referenceDocumentUri ?? null,
    changes: (group?.changes ?? []).map((change) => ({
      name: change.name ?? null,
      delta: change.delta ?? null,
      quantity_after_change: change.quantityAfterChange ?? null,
      ledger_document_uri: change.ledgerDocumentUri ?? null,
      inventory_item_id: change.item?.id ?? null,
      sku: change.item?.sku ?? null,
      location_id: change.location?.id ?? null,
      location_name: change.location?.name ?? null,
    })),
  };
}

function mapLocation(location: GqlLocation) {
  const address = location.address;
  return {
    id: location.id,
    legacy_resource_id: location.legacyResourceId ?? null,
    name: location.name ?? null,
    is_active: location.isActive ?? null,
    activatable: location.activatable ?? null,
    deactivatable: location.deactivatable ?? null,
    deletable: location.deletable ?? null,
    fulfills_online_orders: location.fulfillsOnlineOrders ?? null,
    ships_inventory: location.shipsInventory ?? null,
    has_active_inventory: location.hasActiveInventory ?? null,
    has_unfulfilled_orders: location.hasUnfulfilledOrders ?? null,
    is_fulfillment_service: location.isFulfillmentService ?? null,
    deactivated_at: location.deactivatedAt ?? null,
    address1: address?.address1 ?? null,
    address2: address?.address2 ?? null,
    city: address?.city ?? null,
    province: address?.province ?? null,
    province_code: address?.provinceCode ?? null,
    country: address?.country ?? null,
    country_code: address?.countryCode ?? null,
    zip: address?.zip ?? null,
    phone: address?.phone ?? null,
    formatted_address: Array.isArray(address?.formatted) ? address.formatted.join(', ') : null,
    created_at: location.createdAt ?? null,
    updated_at: location.updatedAt ?? null,
  };
}

function mapPublication(publication: GqlPublication) {
  return {
    id: publication.id,
    title: publication.catalog?.title ?? null,
    catalog_id: publication.catalog?.id ?? null,
    catalog_status: publication.catalog?.status ?? null,
    auto_publish: publication.autoPublish ?? null,
    supports_future_publishing: publication.supportsFuturePublishing ?? null,
  };
}

function mapChannel(publication: GqlChannelPublication) {
  const app = publication.catalog?.apps?.nodes?.[0];
  return {
    name: app?.title ?? publication.catalog?.title ?? null,
    handle: app?.handle ?? null,
    app_id: app?.id ?? null,
    publication_id: publication.id,
    catalog_id: publication.catalog?.id ?? null,
    catalog_status: publication.catalog?.status ?? null,
    auto_publish: publication.autoPublish ?? null,
    supports_future_publishing: publication.supportsFuturePublishing ?? null,
  };
}

function mapTaxonomyCategory(category: GqlTaxonomyCategory) {
  return {
    id: category.id,
    name: category.name ?? null,
    full_name: category.fullName ?? null,
    level: category.level ?? null,
    is_leaf: category.isLeaf ?? null,
    is_root: category.isRoot ?? null,
    is_archived: category.isArchived ?? null,
    parent_id: category.parentId ?? null,
    children_ids: category.childrenIds ?? [],
  };
}

function parseOptionValues(value: unknown): Record<string, string>[] {
  const text = readText(value);
  if (!text) {
    return [];
  }
  return text.split(',').map((pair) => {
    const [optionName, ...rest] = pair.split('=');
    const name = rest.join('=').trim();
    if (!optionName || optionName.trim().length === 0 || name.length === 0) {
      throw new Error(
        `Option values must look like "Color=Red, Size=Large"; could not read "${pair.trim()}".`
      );
    }
    return { optionName: optionName.trim(), name };
  });
}

function splitList(value: unknown): string[] {
  const text = readText(value);
  if (!text) {
    return [];
  }
  return text
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildVariantInputs({
  value,
  mode,
}: {
  value: unknown;
  mode: 'create' | 'update';
}): Record<string, unknown>[] {
  return readRecords(value).map((item) => {
    const variantId = readText(item['variant_id']);
    if (mode === 'update' && !variantId) {
      throw new Error('Every variant to update needs a variant_id.');
    }
    const optionValues = parseOptionValues(item['option_values']);
    if (mode === 'create' && optionValues.length === 0) {
      throw new Error('Every new variant needs option_values, for example "Color=Red, Size=Large".');
    }
    const price = readNumber(item['price']);
    const compareAtPrice = readNumber(item['compare_at_price']);
    const sku = readText(item['sku']);
    const locationId = readText(item['location_id']);
    const availableQuantity = readNumber(item['available_quantity']);
    if (mode === 'create' && (locationId === undefined) !== (availableQuantity === undefined)) {
      throw new Error('Give both location_id and available_quantity to stock a new variant, or neither.');
    }
    const fields = compact({
      optionValues: optionValues.length > 0 ? optionValues : undefined,
      price: price !== undefined ? String(price) : undefined,
      compareAtPrice: compareAtPrice !== undefined ? String(compareAtPrice) : undefined,
      barcode: readText(item['barcode']),
      inventoryPolicy: readText(item['inventory_policy']),
      taxable: toBooleanChoice(item['taxable']),
      inventoryItem: sku !== undefined ? { sku } : undefined,
      inventoryQuantities:
        mode === 'create' && locationId !== undefined && availableQuantity !== undefined
          ? [
              {
                locationId: toGid({ type: 'Location', id: locationId }),
                availableQuantity,
              },
            ]
          : undefined,
    });
    if (mode === 'update') {
      if (Object.keys(fields).length === 0) {
        throw new Error(`Variant ${variantId}: provide at least one field to update.`);
      }
      return { id: toGid({ type: 'ProductVariant', id: variantId ?? '' }), ...fields };
    }
    return fields;
  });
}

function variantsProp({ mode }: { mode: 'create' | 'update' }) {
  return Property.Array({
    displayName: 'Variants',
    description:
      mode === 'create'
        ? 'The variants to create, one entry per variant. Each needs option values for every product option.'
        : 'The variants to change, one entry per variant. Fields left empty keep their values.',
    required: true,
    properties: {
      ...(mode === 'update'
        ? {
            variant_id: Property.ShortText({
              displayName: 'Variant ID',
              description: 'The variant id, numeric or "gid://shopify/ProductVariant/…". Find it with list_product_variants.',
              required: true,
            }),
          }
        : {}),
      option_values: Property.ShortText({
        displayName: 'Option Values',
        description:
          mode === 'create'
            ? 'Option name and value pairs, for example "Color=Red, Size=Large". New values are added to the option.'
            : 'Change the option values, for example "Color=Blue". Leave empty to keep them.',
        required: mode === 'create',
      }),
      price: Property.Number({
        displayName: 'Price',
        description: 'Price in the shop currency, for example 19.99.',
        required: false,
      }),
      compare_at_price: Property.Number({
        displayName: 'Compare-at Price',
        description: 'Original price shown struck through, for example 24.99.',
        required: false,
      }),
      sku: Property.ShortText({
        displayName: 'SKU',
        description: 'Stock keeping unit, for example "TSHIRT-RED-L".',
        required: false,
      }),
      barcode: Property.ShortText({
        displayName: 'Barcode',
        description: 'Barcode such as a UPC or ISBN.',
        required: false,
      }),
      inventory_policy: Property.StaticDropdown({
        displayName: 'When Out of Stock',
        description: 'Whether customers can buy the variant when it is out of stock.',
        required: false,
        options: {
          options: [
            { label: 'Stop selling (deny)', value: 'DENY' },
            { label: 'Continue selling', value: 'CONTINUE' },
          ],
        },
      }),
      taxable: Property.StaticDropdown({
        displayName: 'Taxable',
        description: 'Whether taxes are charged on this variant. Leave empty to keep the current setting.',
        required: false,
        options: {
          options: [
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
          ],
        },
      }),
      ...(mode === 'create'
        ? {
            location_id: Property.ShortText({
              displayName: 'Stock Location ID',
              description: 'Location to stock the new variant at, numeric or "gid://shopify/Location/…". Use with available_quantity.',
              required: false,
            }),
            available_quantity: Property.Number({
              displayName: 'Available Quantity',
              description: 'Starting available quantity at the stock location, for example 10.',
              required: false,
            }),
          }
        : {}),
    },
  });
}

function buildConditions({
  value,
  currency,
}: {
  value: unknown;
  currency: string | undefined;
}): Record<string, unknown>[] {
  return readRecords(value).map((item) => {
    const field = readText(item['field']);
    const relation = readText(item['relation']);
    const conditionValue = readText(item['value']);
    if (!field || !relation) {
      throw new Error('Every condition needs a field and a relation.');
    }
    const allowed = CONDITION_RELATIONS[field];
    if (!allowed) {
      throw new Error(`Unknown condition field "${field}".`);
    }
    if (!allowed.includes(relation)) {
      throw new Error(`Condition field "${field}" allows only these relations: ${allowed.join(', ')}.`);
    }
    const key = CONDITION_INPUT_KEYS[field];
    if (TEXT_CONDITION_FIELDS.includes(field)) {
      if (!conditionValue) {
        throw new Error(`Condition "${field}" needs a value.`);
      }
      return { [key]: { relation, values: [conditionValue], matchType: 'ANY' } };
    }
    if (field === 'variant_inventory') {
      const quantity = readNumber(conditionValue);
      if (quantity === undefined || !Number.isInteger(quantity)) {
        throw new Error('Condition "variant_inventory" needs a whole-number value.');
      }
      return { [key]: { relation, value: quantity } };
    }
    if (field === 'variant_compare_at_price' && (relation === 'IS_SET' || relation === 'IS_NOT_SET')) {
      return { [key]: { relation } };
    }
    const amount = readNumber(conditionValue);
    if (amount === undefined) {
      throw new Error(`Condition "${field}" needs a numeric value, for example 25.`);
    }
    if (!currency) {
      throw new Error('Set "currency" (for example "USD") when using a price condition.');
    }
    return { [key]: { relation, value: { amount: String(amount), currencyCode: currency } } };
  });
}

function conditionsProp({ required, description }: { required: boolean; description: string }) {
  return Property.Array({
    displayName: 'Conditions',
    description,
    required,
    properties: {
      field: Property.StaticDropdown({
        displayName: 'Field',
        description: 'The product or variant field to test.',
        required: true,
        options: {
          options: [
            { label: 'Product tag', value: 'product_tag' },
            { label: 'Product title', value: 'product_title' },
            { label: 'Product type', value: 'product_type' },
            { label: 'Product vendor', value: 'product_vendor' },
            { label: 'Variant title', value: 'variant_title' },
            { label: 'Variant price', value: 'variant_price' },
            { label: 'Variant compare-at price', value: 'variant_compare_at_price' },
            { label: 'Variant inventory', value: 'variant_inventory' },
          ],
        },
      }),
      relation: Property.StaticDropdown({
        displayName: 'Relation',
        description:
          'How to compare. Tags: TAGGED_WITH or NOT_TAGGED_WITH. Text fields: EQUALS, NOT_EQUALS, CONTAINS, DOES_NOT_CONTAIN, STARTS_WITH, ENDS_WITH. Prices: EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN (compare-at price also IS_SET, IS_NOT_SET). Inventory: EQUALS, GREATER_THAN, LESS_THAN.',
        required: true,
        options: {
          options: [
            { label: 'Tagged with', value: 'TAGGED_WITH' },
            { label: 'Not tagged with', value: 'NOT_TAGGED_WITH' },
            { label: 'Equals', value: 'EQUALS' },
            { label: 'Does not equal', value: 'NOT_EQUALS' },
            { label: 'Contains', value: 'CONTAINS' },
            { label: 'Does not contain', value: 'DOES_NOT_CONTAIN' },
            { label: 'Starts with', value: 'STARTS_WITH' },
            { label: 'Ends with', value: 'ENDS_WITH' },
            { label: 'Greater than', value: 'GREATER_THAN' },
            { label: 'Less than', value: 'LESS_THAN' },
            { label: 'Is set', value: 'IS_SET' },
            { label: 'Is not set', value: 'IS_NOT_SET' },
          ],
        },
      }),
      value: Property.ShortText({
        displayName: 'Value',
        description: 'The value to compare with, for example "summer", "Nike" or 25. Leave empty only for IS_SET / IS_NOT_SET.',
        required: false,
      }),
    },
  });
}

function collectionSortOrderProp() {
  return Property.StaticDropdown({
    displayName: 'Product Sort Order',
    description: 'How products are ordered inside the collection. Manual is required before reorder_collection_products.',
    required: false,
    options: {
      options: [
        { label: 'Manual', value: 'MANUAL' },
        { label: 'Best selling', value: 'BEST_SELLING' },
        { label: 'Alphabetical A-Z', value: 'ALPHA_ASC' },
        { label: 'Alphabetical Z-A', value: 'ALPHA_DESC' },
        { label: 'Price low to high', value: 'PRICE_ASC' },
        { label: 'Price high to low', value: 'PRICE_DESC' },
        { label: 'Newest first', value: 'CREATED_DESC' },
        { label: 'Oldest first', value: 'CREATED' },
        { label: 'Most relevant', value: 'MOST_RELEVANT' },
      ],
    },
  });
}

function productStatusProp({ description }: { description: string }) {
  return Property.StaticDropdown({
    displayName: 'Status',
    description,
    required: false,
    options: {
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Archived', value: 'ARCHIVED' },
        { label: 'Unlisted', value: 'UNLISTED' },
      ],
    },
  });
}

function toSeo({
  title,
  description,
}: {
  title: string | undefined | null;
  description: string | undefined | null;
}): Record<string, unknown> | undefined {
  const seo = compact({ title: nonEmpty(title), description: nonEmpty(description) });
  return Object.keys(seo).length > 0 ? seo : undefined;
}

function toCategoryGid(value: string | undefined | null): string | undefined {
  const category = nonEmpty(value);
  return category ? toOpaqueGid({ type: 'TaxonomyCategory', id: category }) : undefined;
}

async function mergeSeo({
  auth,
  id,
  title,
  description,
}: {
  auth: ShopifyAuth;
  id: string;
  title: string | undefined | null;
  description: string | undefined | null;
}): Promise<Record<string, unknown> | undefined> {
  const newTitle = nonEmpty(title);
  const newDescription = nonEmpty(description);
  if (newTitle === undefined && newDescription === undefined) {
    return undefined;
  }
  if (newTitle !== undefined && newDescription !== undefined) {
    return { title: newTitle, description: newDescription };
  }
  const { data } = await shopifyGraphql<{
    node: { seo?: { title?: string | null; description?: string | null } | null } | null;
  }>({
    auth,
    query: `query ReadCurrentSeo($id: ID!) { node(id: $id) { ... on Product { seo { title description } } ... on Collection { seo { title description } } } }`,
    variables: { id },
  });
  const current = data.node?.seo;
  return {
    title: newTitle ?? current?.title ?? null,
    description: newDescription ?? current?.description ?? null,
  };
}

function groupVariantMedia(value: unknown): { variantId: string; mediaIds: string[] }[] {
  const grouped = readRecords(value).reduce<Record<string, string[]>>((acc, item) => {
    const variantId = readText(item['variant_id']);
    const mediaId = readText(item['media_id']);
    if (!variantId || !mediaId) {
      throw new Error('Every entry needs a variant_id and a media_id.');
    }
    const key = toGid({ type: 'ProductVariant', id: variantId });
    const media = toGid({ type: 'MediaImage', id: mediaId });
    return { ...acc, [key]: [...(acc[key] ?? []), media] };
  }, {});
  const entries = Object.entries(grouped).map(([variantId, mediaIds]) => ({ variantId, mediaIds }));
  if (entries.length === 0) {
    throw new Error('Provide at least one variant and media pair.');
  }
  return entries;
}

function toGidList({ type, value }: { type: string; value: unknown }): string[] | undefined {
  const ids = readStringList(value);
  if (!ids || ids.length === 0) {
    return undefined;
  }
  return ids.map((id) => toGid({ type, id }));
}

const MONEY_FIELDS = 'shopMoney { amount currencyCode }';

const MONEY_WITH_PRESENTMENT_FIELDS =
  'shopMoney { amount currencyCode } presentmentMoney { amount currencyCode }';

const CONNECTION_LIST_FIELDS = ['nodes', 'edges'];

const ADDRESS_FIELDS =
  'id firstName lastName name company address1 address2 city province provinceCode country countryCodeV2 zip phone';

const ORDER_SUMMARY_FIELDS = `id legacyResourceId name createdAt updatedAt processedAt closed closedAt cancelledAt cancelReason displayFinancialStatus displayFulfillmentStatus test email phone note tags poNumber sourceName currencyCode subtotalPriceSet { ${MONEY_FIELDS} } totalPriceSet { ${MONEY_FIELDS} } totalTaxSet { ${MONEY_FIELDS} } totalDiscountsSet { ${MONEY_FIELDS} } totalShippingPriceSet { ${MONEY_FIELDS} } totalRefundedSet { ${MONEY_FIELDS} } totalOutstandingSet { ${MONEY_FIELDS} } currentTotalPriceSet { ${MONEY_FIELDS} } customer { id displayName defaultEmailAddress { emailAddress } }`;

const ORDER_DETAIL_FIELDS = `${ORDER_SUMMARY_FIELDS} number confirmed capturable refundable fullyPaid unpaid canMarkAsPaid fulfillmentsCount { count } transactionsCount { count } discountCodes paymentGatewayNames shippingLine { title originalPriceSet { ${MONEY_FIELDS} } } shippingAddress { ${ADDRESS_FIELDS} } billingAddress { ${ADDRESS_FIELDS} } lineItems(first: 100) { pageInfo { hasNextPage } nodes { id name title sku variantTitle vendor quantity currentQuantity refundableQuantity unfulfilledQuantity requiresShipping taxable originalUnitPriceSet { ${MONEY_FIELDS} } discountedTotalSet { ${MONEY_FIELDS} } variant { id } product { id } } }`;

const TRANSACTION_FIELDS = `id kind status gateway formattedGateway test createdAt processedAt errorCode paymentId authorizationExpiresAt manuallyCapturable multiCapturable amountSet { ${MONEY_FIELDS} } totalUnsettledSet { ${MONEY_FIELDS} } maximumRefundableV2 { amount currencyCode } parentTransaction { id } order { id name }`;

const REFUND_FIELDS = `id legacyResourceId note createdAt processedAt updatedAt totalRefundedSet { ${MONEY_FIELDS} } order { id name } refundLineItems(first: 50) { nodes { quantity restockType restocked subtotalSet { ${MONEY_FIELDS} } totalTaxSet { ${MONEY_FIELDS} } lineItem { id title sku } } } transactions(first: 20) { nodes { id kind status gateway amountSet { ${MONEY_FIELDS} } } }`;

const REFUND_SUMMARY_FIELDS = `id legacyResourceId note createdAt processedAt updatedAt totalRefundedSet { ${MONEY_FIELDS} }`;

const DRAFT_ORDER_SUMMARY_FIELDS = `id legacyResourceId name status createdAt updatedAt completedAt invoiceUrl invoiceSentAt email phone note2 tags poNumber ready currencyCode subtotalPriceSet { ${MONEY_FIELDS} } totalPriceSet { ${MONEY_FIELDS} } totalTaxSet { ${MONEY_FIELDS} } totalDiscountsSet { ${MONEY_FIELDS} } totalShippingPriceSet { ${MONEY_FIELDS} } customer { id displayName } order { id name }`;

const DRAFT_ORDER_DETAIL_FIELDS = `${DRAFT_ORDER_SUMMARY_FIELDS} reserveInventoryUntil taxExempt taxesIncluded discountCodes appliedDiscount { title value valueType amountSet { ${MONEY_FIELDS} } } paymentTerms { id paymentTermsName paymentTermsType dueInDays } shippingLine { title originalPriceSet { ${MONEY_FIELDS} } } shippingAddress { ${ADDRESS_FIELDS} } lineItems(first: 100) { pageInfo { hasNextPage } nodes { id name title sku quantity custom originalUnitPriceSet { ${MONEY_FIELDS} } discountedTotalSet { ${MONEY_FIELDS} } variant { id } } }`;

const CUSTOMER_FIELDS = `id legacyResourceId displayName firstName lastName defaultEmailAddress { emailAddress marketingState marketingOptInLevel marketingUpdatedAt } defaultPhoneNumber { phoneNumber } note tags state verifiedEmail taxExempt locale numberOfOrders amountSpent { amount currencyCode } canDelete lastOrder { id name } defaultAddress { ${ADDRESS_FIELDS} } createdAt updatedAt`;

const ABANDONED_CHECKOUT_FIELDS = `id name createdAt updatedAt completedAt abandonedCheckoutUrl note discountCodes taxesIncluded subtotalPriceSet { ${MONEY_FIELDS} } totalPriceSet { ${MONEY_FIELDS} } customer { id displayName defaultEmailAddress { emailAddress } } shippingAddress { countryCodeV2 }`;

const ABANDONMENT_FIELDS = `id abandonmentType mostRecentStep createdAt emailState emailSentAt cartUrl inventoryAvailable isFromOnlineStore customerHasNoOrderSinceAbandonment lastCheckoutAbandonmentDate customer { id displayName defaultEmailAddress { emailAddress } } abandonedCheckoutPayload { id name abandonedCheckoutUrl totalPriceSet { ${MONEY_FIELDS} } }`;

const PAGE_INFO_FIELDS = 'pageInfo { hasNextPage endCursor }';

export { SHOPIFY_API_VERSION };
const MEDIA_SUMMARY_FIELDS =
  'id alt mediaContentType status preview { image { url } } ... on MediaImage { mimeType image { url width height } } ... on ExternalVideo { originUrl } ... on Video { filename } ... on Model3d { filename }';

const MEDIA_FIELDS = `${MEDIA_SUMMARY_FIELDS} mediaErrors { code message }`;

const VARIANT_FIELDS =
  'id legacyResourceId title displayName sku barcode price compareAtPrice position inventoryQuantity inventoryPolicy availableForSale taxable createdAt updatedAt selectedOptions { name value } inventoryItem { id tracked requiresShipping } product { id title }';

const PRODUCT_SUMMARY_FIELDS =
  'id legacyResourceId title handle status vendor productType tags createdAt updatedAt publishedAt totalInventory tracksInventory hasOnlyDefaultVariant variantsCount { count } mediaCount { count } priceRangeV2 { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } featuredMedia { id preview { image { url } } } category { id fullName }';

const PRODUCT_DETAIL_FIELDS = `${PRODUCT_SUMMARY_FIELDS} descriptionHtml templateSuffix seo { title description } isGiftCard requiresSellingPlan options { id name position optionValues { id name hasVariants } } variants(first: 100) { pageInfo { hasNextPage } nodes { ${VARIANT_FIELDS} } } media(first: 50) { pageInfo { hasNextPage } nodes { ${MEDIA_SUMMARY_FIELDS} } }`;

const COLLECTION_SUMMARY_FIELDS =
  'id legacyResourceId title handle sortOrder updatedAt productsCount { count } image { url altText }';

const COLLECTION_CONDITION_FIELDS =
  '__typename id ... on CollectionSourceInclusionConditionProductTag { tagRelation: relation tagValues: values } ... on CollectionSourceInclusionConditionProductTitle { titleRelation: relation titleValues: values } ... on CollectionSourceInclusionConditionProductType { typeRelation: relation typeValues: values } ... on CollectionSourceInclusionConditionProductVendor { vendorRelation: relation vendorValues: values } ... on CollectionSourceInclusionConditionVariantTitle { variantTitleRelation: relation variantTitleValues: values } ... on CollectionSourceInclusionConditionVariantPrice { priceRelation: relation priceValue: value { amount currencyCode } } ... on CollectionSourceInclusionConditionVariantCompareAtPrice { compareAtPriceRelation: relation compareAtPriceValue: value { amount currencyCode } } ... on CollectionSourceInclusionConditionVariantInventory { inventoryRelation: relation inventoryValue: value }';

const COLLECTION_SELECTIONS_LIMIT = 25;

const COLLECTION_FIELDS = `${COLLECTION_SUMMARY_FIELDS} descriptionHtml templateSuffix seo { title description } sources { __typename id title ... on CollectionConditionsSource { shareable app { id } targetType inclusion { matchType conditions { ${COLLECTION_CONDITION_FIELDS} } selections(first: ${COLLECTION_SELECTIONS_LIMIT}) { pageInfo { hasNextPage } nodes { product { id title } variantIds } } } } }`;

const COLLECTION_SOURCE_LOOKUP_FIELDS =
  'id sources { __typename id title ... on CollectionConditionsSource { shareable app { id } } }';

const INVENTORY_ITEM_FIELDS =
  'id legacyResourceId sku tracked requiresShipping countryCodeOfOrigin provinceCodeOfOrigin harmonizedSystemCode unitCost { amount currencyCode } measurement { weight { value unit } } locationsCount { count } createdAt updatedAt variants(first: 1) { nodes { id displayName product { id title } } }';

const INVENTORY_LEVEL_FIELDS =
  'id isActive canDeactivate deactivationAlert updatedAt item { id sku } location { id name } quantities(names: ["available", "on_hand", "committed", "incoming", "reserved", "damaged", "safety_stock", "quality_control"]) { name quantity }';

const INVENTORY_ADJUSTMENT_GROUP_FIELDS =
  'id createdAt reason referenceDocumentUri changes { name delta quantityAfterChange ledgerDocumentUri item { id sku } location { id name } }';

const LOCATION_FIELDS =
  'id legacyResourceId name isActive activatable deactivatable deletable fulfillsOnlineOrders shipsInventory hasActiveInventory hasUnfulfilledOrders isFulfillmentService deactivatedAt createdAt updatedAt address { address1 address2 city province provinceCode country countryCode zip phone formatted }';

const PUBLICATION_FIELDS =
  'id autoPublish supportsFuturePublishing catalog { id title status }';

const CHANNEL_FIELDS =
  'id autoPublish supportsFuturePublishing catalog { id title status ... on AppCatalog { apps(first: 1) { nodes { id title handle } } } }';

const TAXONOMY_CATEGORY_FIELDS =
  'id name fullName level isLeaf isRoot isArchived parentId childrenIds';

const TEXT_CONDITION_FIELDS = [
  'product_tag',
  'product_title',
  'product_type',
  'product_vendor',
  'variant_title',
];

const TEXT_RELATIONS = ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'DOES_NOT_CONTAIN', 'STARTS_WITH', 'ENDS_WITH'];

const CONDITION_RELATIONS: Record<string, string[]> = {
  product_tag: ['TAGGED_WITH', 'NOT_TAGGED_WITH'],
  product_title: TEXT_RELATIONS,
  product_type: TEXT_RELATIONS,
  product_vendor: TEXT_RELATIONS,
  variant_title: TEXT_RELATIONS,
  variant_price: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN'],
  variant_compare_at_price: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IS_SET', 'IS_NOT_SET'],
  variant_inventory: ['EQUALS', 'GREATER_THAN', 'LESS_THAN'],
};

const CONDITION_INPUT_KEYS: Record<string, string> = {
  product_tag: 'productTag',
  product_title: 'productTitle',
  product_type: 'productType',
  product_vendor: 'productVendor',
  variant_title: 'variantTitle',
  variant_price: 'variantPrice',
  variant_compare_at_price: 'variantCompareAtPrice',
  variant_inventory: 'variantInventory',
};

const MANUAL_SELECTION_SOURCE_TITLE = 'Selected products';

const CONDITIONS_SOURCE_TITLE = 'Product conditions';


export const shopifyFields = {
  MONEY_FIELDS,
  MONEY_WITH_PRESENTMENT_FIELDS,
  ADDRESS_FIELDS,
  ORDER_SUMMARY_FIELDS,
  ORDER_DETAIL_FIELDS,
  TRANSACTION_FIELDS,
  REFUND_FIELDS,
  REFUND_SUMMARY_FIELDS,
  DRAFT_ORDER_SUMMARY_FIELDS,
  DRAFT_ORDER_DETAIL_FIELDS,
  CUSTOMER_FIELDS,
  ABANDONED_CHECKOUT_FIELDS,
  ABANDONMENT_FIELDS,
  PAGE_INFO_FIELDS,
  MEDIA_FIELDS,
  VARIANT_FIELDS,
  PRODUCT_SUMMARY_FIELDS,
  PRODUCT_DETAIL_FIELDS,
  COLLECTION_SUMMARY_FIELDS,
  COLLECTION_FIELDS,
  COLLECTION_SOURCE_LOOKUP_FIELDS,
  COLLECTION_SELECTIONS_LIMIT,
  INVENTORY_ITEM_FIELDS,
  INVENTORY_LEVEL_FIELDS,
  INVENTORY_ADJUSTMENT_GROUP_FIELDS,
  LOCATION_FIELDS,
  PUBLICATION_FIELDS,
  CHANNEL_FIELDS,
  TAXONOMY_CATEGORY_FIELDS,
  MANUAL_SELECTION_SOURCE_TITLE,
  CONDITIONS_SOURCE_TITLE,
};

export const shopifyGraphqlClient = {
  request: shopifyGraphql,
  toGid,
  toOpaqueGid,
  resolveIdempotencyKey,
};

export const shopifyValues = {
  readFirst,
  nonEmpty,
  readStringList,
  readRecords,
  readText,
  readNumber,
  toBooleanChoice,
  compact,
  money,
  presentmentMoney,
  presentmentCurrency,
  isRecord,
  buildMailingAddress,
  buildRefundLineItems,
  buildDraftLineItems,
  parseOptionValues,
  splitList,
  buildVariantInputs,
  buildConditions,
  toSeo,
  mergeSeo,
  toCategoryGid,
  toGidList,
  findConditionsSource,
  editableConditionsSources,
  sharedConditionsSources,
  findExplicitConditionsSource,
  groupVariantMedia,
};

export const shopifyMappers = {
  toPage,
  mapAddress,
  mapOrderSummary,
  mapOrderDetail,
  mapTransaction,
  mapRefund,
  mapRefundSummary,
  mapDraftOrderSummary,
  mapDraftOrderDetail,
  mapCustomer,
  mapAbandonedCheckout,
  mapAbandonment,
  mapProductSummary,
  mapProductDetail,
  mapProductOption,
  mapVariant,
  mapMedia,
  mapCollectionSummary,
  mapCollection,
  mapInventoryItem,
  mapInventoryLevel,
  mapAdjustmentGroup,
  mapLocation,
  mapPublication,
  mapChannel,
  mapTaxonomyCategory,
};

export const shopifyProps = {
  address: addressProps,
  first: firstProp,
  after: afterProp,
  reverse: reverseProp,
  searchQuery: searchQueryProp,
  booleanChoice: booleanChoiceProp,
  idempotencyKey: idempotencyKeyProp,
  refundLineItems: refundLineItemsProp,
  draftLineItems: draftLineItemsProp,
  variants: variantsProp,
  conditions: conditionsProp,
  collectionSortOrder: collectionSortOrderProp,
  productStatus: productStatusProp,
};

export type ShopifyGraphqlParams = {
  auth: ShopifyAuth;
  query: string;
  variables?: Record<string, unknown>;
  idempotencyKey?: string;
  primaryPaths?: string[];
  toleratedUserErrorCodes?: string[];
};

export type ShopifyGraphqlResult<TData> = {
  data: TData;
  redactedFields: string[];
};

export type ShopifyGraphqlError = {
  message?: string;
  path?: (string | number)[];
  extensions?: {
    code?: string;
    requiredAccess?: string;
    documentation?: string;
  };
};

export type ShopifyGraphqlResponse<TData> = {
  data?: TData | null;
  errors?: ShopifyGraphqlError[];
  extensions?: {
    cost?: {
      throttleStatus?: Record<string, unknown>;
    };
  };
};

export type ShopifyPage<TItem> = {
  items: TItem[];
  count: number;
  has_next_page: boolean;
  end_cursor: string | null;
  redacted_fields: string[];
};

export type ToGidParams = {
  type: string;
  id: string | number;
  query?: string;
};

export type AddressProps = {
  first_name?: string;
  last_name?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province_code?: string;
  country_code?: string;
  zip?: string;
  phone?: string;
};

export type FlatAddress = {
  id: string | null;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  province_code: string | null;
  country: string | null;
  country_code: string | null;
  zip: string | null;
  phone: string | null;
};

export type GqlMoneyBag = {
  shopMoney?: { amount?: string | null; currencyCode?: string | null } | null;
  presentmentMoney?: { amount?: string | null; currencyCode?: string | null } | null;
};

export type GqlMoneyV2 = {
  amount?: string | null;
  currencyCode?: string | null;
};

export type GqlConnection<TNode> = {
  nodes?: TNode[] | null;
  pageInfo?: { hasNextPage?: boolean | null; endCursor?: string | null } | null;
};

export type GqlCount = {
  count?: number | null;
  precision?: string | null;
};

export type GqlMailingAddress = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  company?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  province?: string | null;
  provinceCode?: string | null;
  country?: string | null;
  countryCodeV2?: string | null;
  zip?: string | null;
  phone?: string | null;
};

export type GqlCustomerRef = {
  id?: string | null;
  displayName?: string | null;
  defaultEmailAddress?: { emailAddress?: string | null } | null;
};

export type GqlOrder = {
  id: string;
  legacyResourceId?: string | null;
  name?: string | null;
  number?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  processedAt?: string | null;
  closed?: boolean | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  confirmed?: boolean | null;
  test?: boolean | null;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  tags?: string[] | null;
  poNumber?: string | null;
  sourceName?: string | null;
  currencyCode?: string | null;
  subtotalPriceSet?: GqlMoneyBag | null;
  totalPriceSet?: GqlMoneyBag | null;
  totalTaxSet?: GqlMoneyBag | null;
  totalDiscountsSet?: GqlMoneyBag | null;
  totalShippingPriceSet?: GqlMoneyBag | null;
  totalRefundedSet?: GqlMoneyBag | null;
  totalOutstandingSet?: GqlMoneyBag | null;
  currentTotalPriceSet?: GqlMoneyBag | null;
  capturable?: boolean | null;
  refundable?: boolean | null;
  fullyPaid?: boolean | null;
  unpaid?: boolean | null;
  canMarkAsPaid?: boolean | null;
  fulfillmentsCount?: GqlCount | null;
  transactionsCount?: GqlCount | null;
  discountCodes?: string[] | null;
  paymentGatewayNames?: string[] | null;
  shippingLine?: { title?: string | null; originalPriceSet?: GqlMoneyBag | null } | null;
  shippingAddress?: GqlMailingAddress | null;
  billingAddress?: GqlMailingAddress | null;
  customer?: GqlCustomerRef | null;
  lineItems?: GqlConnection<GqlLineItem> | null;
};

export type GqlLineItem = {
  id: string;
  name?: string | null;
  title?: string | null;
  sku?: string | null;
  variantTitle?: string | null;
  vendor?: string | null;
  quantity?: number | null;
  currentQuantity?: number | null;
  refundableQuantity?: number | null;
  unfulfilledQuantity?: number | null;
  requiresShipping?: boolean | null;
  taxable?: boolean | null;
  originalUnitPriceSet?: GqlMoneyBag | null;
  discountedTotalSet?: GqlMoneyBag | null;
  variant?: { id?: string | null } | null;
  product?: { id?: string | null } | null;
};

export type GqlTransaction = {
  id: string;
  kind?: string | null;
  status?: string | null;
  gateway?: string | null;
  formattedGateway?: string | null;
  test?: boolean | null;
  createdAt?: string | null;
  processedAt?: string | null;
  errorCode?: string | null;
  paymentId?: string | null;
  authorizationExpiresAt?: string | null;
  manuallyCapturable?: boolean | null;
  multiCapturable?: boolean | null;
  amountSet?: GqlMoneyBag | null;
  totalUnsettledSet?: GqlMoneyBag | null;
  maximumRefundableV2?: GqlMoneyV2 | null;
  parentTransaction?: { id?: string | null } | null;
  order?: { id?: string | null; name?: string | null } | null;
};

export type GqlRefund = {
  id: string;
  legacyResourceId?: string | null;
  note?: string | null;
  createdAt?: string | null;
  processedAt?: string | null;
  updatedAt?: string | null;
  totalRefundedSet?: GqlMoneyBag | null;
  order?: { id?: string | null; name?: string | null } | null;
  refundLineItems?: GqlConnection<{
    quantity?: number | null;
    restockType?: string | null;
    restocked?: boolean | null;
    subtotalSet?: GqlMoneyBag | null;
    totalTaxSet?: GqlMoneyBag | null;
    lineItem?: { id?: string | null; title?: string | null; sku?: string | null } | null;
  }> | null;
  transactions?: GqlConnection<{
    id: string;
    kind?: string | null;
    status?: string | null;
    gateway?: string | null;
    amountSet?: GqlMoneyBag | null;
  }> | null;
};

export type GqlDraftOrder = {
  id: string;
  legacyResourceId?: string | null;
  name?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
  invoiceUrl?: string | null;
  invoiceSentAt?: string | null;
  email?: string | null;
  phone?: string | null;
  note2?: string | null;
  tags?: string[] | null;
  poNumber?: string | null;
  ready?: boolean | null;
  currencyCode?: string | null;
  subtotalPriceSet?: GqlMoneyBag | null;
  totalPriceSet?: GqlMoneyBag | null;
  totalTaxSet?: GqlMoneyBag | null;
  totalDiscountsSet?: GqlMoneyBag | null;
  totalShippingPriceSet?: GqlMoneyBag | null;
  customer?: { id?: string | null; displayName?: string | null } | null;
  order?: { id?: string | null; name?: string | null } | null;
  reserveInventoryUntil?: string | null;
  taxExempt?: boolean | null;
  taxesIncluded?: boolean | null;
  discountCodes?: string[] | null;
  appliedDiscount?: {
    title?: string | null;
    value?: number | null;
    valueType?: string | null;
    amountSet?: GqlMoneyBag | null;
  } | null;
  paymentTerms?: {
    id?: string | null;
    paymentTermsName?: string | null;
    paymentTermsType?: string | null;
    dueInDays?: number | null;
  } | null;
  shippingLine?: { title?: string | null; originalPriceSet?: GqlMoneyBag | null } | null;
  shippingAddress?: GqlMailingAddress | null;
  lineItems?: GqlConnection<{
    id: string;
    name?: string | null;
    title?: string | null;
    sku?: string | null;
    quantity?: number | null;
    custom?: boolean | null;
    originalUnitPriceSet?: GqlMoneyBag | null;
    discountedTotalSet?: GqlMoneyBag | null;
    variant?: { id?: string | null } | null;
  }> | null;
};

export type GqlCustomer = {
  id: string;
  legacyResourceId?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  defaultEmailAddress?: {
    emailAddress?: string | null;
    marketingState?: string | null;
    marketingOptInLevel?: string | null;
    marketingUpdatedAt?: string | null;
  } | null;
  defaultPhoneNumber?: { phoneNumber?: string | null } | null;
  note?: string | null;
  tags?: string[] | null;
  state?: string | null;
  verifiedEmail?: boolean | null;
  taxExempt?: boolean | null;
  locale?: string | null;
  numberOfOrders?: string | null;
  amountSpent?: GqlMoneyV2 | null;
  canDelete?: boolean | null;
  lastOrder?: { id?: string | null; name?: string | null } | null;
  defaultAddress?: GqlMailingAddress | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GqlAbandonedCheckout = {
  id: string;
  name?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
  abandonedCheckoutUrl?: string | null;
  note?: string | null;
  discountCodes?: string[] | null;
  taxesIncluded?: boolean | null;
  subtotalPriceSet?: GqlMoneyBag | null;
  totalPriceSet?: GqlMoneyBag | null;
  customer?: GqlCustomerRef | null;
  shippingAddress?: { countryCodeV2?: string | null } | null;
};

export type GqlAbandonment = {
  id: string;
  abandonmentType?: string | null;
  mostRecentStep?: string | null;
  createdAt?: string | null;
  emailState?: string | null;
  emailSentAt?: string | null;
  cartUrl?: string | null;
  inventoryAvailable?: boolean | null;
  isFromOnlineStore?: boolean | null;
  customerHasNoOrderSinceAbandonment?: boolean | null;
  lastCheckoutAbandonmentDate?: string | null;
  customer?: GqlCustomerRef | null;
  abandonedCheckoutPayload?: {
    id?: string | null;
    name?: string | null;
    abandonedCheckoutUrl?: string | null;
    totalPriceSet?: GqlMoneyBag | null;
  } | null;
};

export type GqlMedia = {
  id?: string | null;
  alt?: string | null;
  mediaContentType?: string | null;
  status?: string | null;
  mediaErrors?: { code?: string | null; message?: string | null }[] | null;
  preview?: { image?: { url?: string | null } | null } | null;
  mimeType?: string | null;
  image?: { url?: string | null; width?: number | null; height?: number | null } | null;
  originUrl?: string | null;
  filename?: string | null;
};

export type GqlVariant = {
  id: string;
  legacyResourceId?: string | null;
  title?: string | null;
  displayName?: string | null;
  sku?: string | null;
  barcode?: string | null;
  price?: string | null;
  compareAtPrice?: string | null;
  position?: number | null;
  inventoryQuantity?: number | null;
  inventoryPolicy?: string | null;
  availableForSale?: boolean | null;
  taxable?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  selectedOptions?: { name?: string | null; value?: string | null }[] | null;
  inventoryItem?: { id?: string | null; tracked?: boolean | null; requiresShipping?: boolean | null } | null;
  product?: { id?: string | null; title?: string | null } | null;
  media?: GqlConnection<{ id?: string | null }> | null;
};

export type GqlProductOption = {
  id: string;
  name?: string | null;
  position?: number | null;
  optionValues?: { id: string; name?: string | null; hasVariants?: boolean | null }[] | null;
};

export type GqlProduct = {
  id: string;
  legacyResourceId?: string | null;
  title?: string | null;
  handle?: string | null;
  status?: string | null;
  vendor?: string | null;
  productType?: string | null;
  tags?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  totalInventory?: number | null;
  tracksInventory?: boolean | null;
  hasOnlyDefaultVariant?: boolean | null;
  variantsCount?: GqlCount | null;
  mediaCount?: GqlCount | null;
  priceRangeV2?: { minVariantPrice?: GqlMoneyV2 | null; maxVariantPrice?: GqlMoneyV2 | null } | null;
  featuredMedia?: { id?: string | null; preview?: { image?: { url?: string | null } | null } | null } | null;
  category?: { id?: string | null; fullName?: string | null } | null;
  descriptionHtml?: string | null;
  templateSuffix?: string | null;
  seo?: { title?: string | null; description?: string | null } | null;
  isGiftCard?: boolean | null;
  requiresSellingPlan?: boolean | null;
  options?: GqlProductOption[] | null;
  variants?: GqlConnection<GqlVariant> | null;
  media?: GqlConnection<GqlMedia> | null;
};

export type GqlCollectionCondition = {
  __typename?: string | null;
  id: string;
  tagRelation?: string | null;
  tagValues?: string[] | null;
  titleRelation?: string | null;
  titleValues?: string[] | null;
  typeRelation?: string | null;
  typeValues?: string[] | null;
  vendorRelation?: string | null;
  vendorValues?: string[] | null;
  variantTitleRelation?: string | null;
  variantTitleValues?: string[] | null;
  priceRelation?: string | null;
  priceValue?: GqlMoneyV2 | null;
  compareAtPriceRelation?: string | null;
  compareAtPriceValue?: GqlMoneyV2 | null;
  inventoryRelation?: string | null;
  inventoryValue?: number | null;
};

export type GqlCollectionSource = {
  __typename?: string | null;
  id: string;
  title?: string | null;
  shareable?: boolean | null;
  app?: { id?: string | null } | null;
  targetType?: string | null;
  inclusion?: {
    matchType?: string | null;
    conditions?: GqlCollectionCondition[] | null;
    selections?: {
      pageInfo?: { hasNextPage?: boolean | null } | null;
      nodes?: { product?: { id?: string | null; title?: string | null } | null; variantIds?: string[] | null }[] | null;
    } | null;
  } | null;
};

export type GqlCollection = {
  id: string;
  legacyResourceId?: string | null;
  title?: string | null;
  handle?: string | null;
  sortOrder?: string | null;
  updatedAt?: string | null;
  productsCount?: GqlCount | null;
  image?: { url?: string | null; altText?: string | null } | null;
  descriptionHtml?: string | null;
  templateSuffix?: string | null;
  seo?: { title?: string | null; description?: string | null } | null;
  sources?: GqlCollectionSource[] | null;
};

export type GqlInventoryItem = {
  id: string;
  legacyResourceId?: string | null;
  sku?: string | null;
  tracked?: boolean | null;
  requiresShipping?: boolean | null;
  countryCodeOfOrigin?: string | null;
  provinceCodeOfOrigin?: string | null;
  harmonizedSystemCode?: string | null;
  unitCost?: GqlMoneyV2 | null;
  measurement?: { weight?: { value?: number | null; unit?: string | null } | null } | null;
  locationsCount?: GqlCount | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  variants?: GqlConnection<{
    id?: string | null;
    displayName?: string | null;
    product?: { id?: string | null; title?: string | null } | null;
  }> | null;
};

export type GqlInventoryLevel = {
  id: string;
  isActive?: boolean | null;
  canDeactivate?: boolean | null;
  deactivationAlert?: string | null;
  updatedAt?: string | null;
  item?: { id?: string | null; sku?: string | null } | null;
  location?: { id?: string | null; name?: string | null } | null;
  quantities?: { name?: string | null; quantity?: number | null }[] | null;
};

export type GqlInventoryAdjustmentGroup = {
  id?: string | null;
  createdAt?: string | null;
  reason?: string | null;
  referenceDocumentUri?: string | null;
  changes?: {
    name?: string | null;
    delta?: number | null;
    quantityAfterChange?: number | null;
    ledgerDocumentUri?: string | null;
    item?: { id?: string | null; sku?: string | null } | null;
    location?: { id?: string | null; name?: string | null } | null;
  }[] | null;
};

export type GqlLocation = {
  id: string;
  legacyResourceId?: string | null;
  name?: string | null;
  isActive?: boolean | null;
  activatable?: boolean | null;
  deactivatable?: boolean | null;
  deletable?: boolean | null;
  fulfillsOnlineOrders?: boolean | null;
  shipsInventory?: boolean | null;
  hasActiveInventory?: boolean | null;
  hasUnfulfilledOrders?: boolean | null;
  isFulfillmentService?: boolean | null;
  deactivatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  address?: {
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    province?: string | null;
    provinceCode?: string | null;
    country?: string | null;
    countryCode?: string | null;
    zip?: string | null;
    phone?: string | null;
    formatted?: string[] | null;
  } | null;
};

export type GqlPublication = {
  id: string;
  autoPublish?: boolean | null;
  supportsFuturePublishing?: boolean | null;
  catalog?: { id?: string | null; title?: string | null; status?: string | null } | null;
};

export type GqlChannelPublication = {
  id: string;
  autoPublish?: boolean | null;
  supportsFuturePublishing?: boolean | null;
  catalog?: {
    id?: string | null;
    title?: string | null;
    status?: string | null;
    apps?: { nodes?: { id?: string | null; title?: string | null; handle?: string | null }[] | null } | null;
  } | null;
};

export type GqlTaxonomyCategory = {
  id: string;
  name?: string | null;
  fullName?: string | null;
  level?: number | null;
  isLeaf?: boolean | null;
  isRoot?: boolean | null;
  isArchived?: boolean | null;
  parentId?: string | null;
  childrenIds?: string[] | null;
};

export type GqlJob = {
  id?: string | null;
  done?: boolean | null;
};
