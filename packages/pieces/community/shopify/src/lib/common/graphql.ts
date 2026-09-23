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
    if (/exemption/i.test(denied.message ?? '')) {
      return new Error(
        `Shopify denied access: this operation needs an exemption granted by Shopify in addition to the access scope, so adding scopes or reinstalling the app will not fix it. Do not retry. Shopify said: ${denied.message ?? ''}`.trim()
      );
    }
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

function mapFulfillmentOrder(order: GqlFulfillmentOrder) {
  const destination = order.destination;
  const lineItems = order.lineItems;
  return {
    id: order.id,
    status: order.status ?? null,
    request_status: order.requestStatus ?? null,
    order_id: order.orderId ?? null,
    order_name: order.orderName ?? null,
    created_at: order.createdAt ?? null,
    updated_at: order.updatedAt ?? null,
    fulfill_at: order.fulfillAt ?? null,
    fulfill_by: order.fulfillBy ?? null,
    assigned_location_id: order.assignedLocation?.location?.id ?? null,
    assigned_location_name: order.assignedLocation?.name ?? null,
    destination_first_name: destination?.firstName ?? null,
    destination_last_name: destination?.lastName ?? null,
    destination_company: destination?.company ?? null,
    destination_address1: destination?.address1 ?? null,
    destination_address2: destination?.address2 ?? null,
    destination_city: destination?.city ?? null,
    destination_province: destination?.province ?? null,
    destination_zip: destination?.zip ?? null,
    destination_country_code: destination?.countryCode ?? null,
    destination_phone: destination?.phone ?? null,
    destination_email: destination?.email ?? null,
    delivery_method_type: order.deliveryMethod?.methodType ?? null,
    delivery_method_name: order.deliveryMethod?.presentedName ?? null,
    holds: (order.fulfillmentHolds ?? []).map((hold) => ({
      id: hold.id,
      reason: hold.reason ?? null,
      reason_notes: hold.reasonNotes ?? null,
      display_reason: hold.displayReason ?? null,
      handle: hold.handle ?? null,
      held_by_requesting_app: hold.heldByRequestingApp ?? null,
    })),
    supported_actions: (order.supportedActions ?? [])
      .map((entry) => entry.action ?? null)
      .filter((action): action is string => action !== null),
    line_items: (lineItems?.nodes ?? []).map((item) => ({
      id: item.id,
      sku: item.sku ?? null,
      product_title: item.productTitle ?? null,
      variant_title: item.variantTitle ?? null,
      total_quantity: item.totalQuantity ?? null,
      remaining_quantity: item.remainingQuantity ?? null,
      requires_shipping: item.requiresShipping ?? null,
      line_item_id: item.lineItem?.id ?? null,
      variant_id: item.variant?.id ?? null,
      inventory_item_id: item.inventoryItemId ?? null,
    })),
    line_items_truncated: lineItems?.pageInfo?.hasNextPage ?? false,
  };
}

function mapFulfillmentOrderOrNull(order: GqlFulfillmentOrder | null | undefined) {
  return order ? mapFulfillmentOrder(order) : null;
}

function mapFulfillmentSummary(fulfillment: GqlFulfillment) {
  const tracking = fulfillment.trackingInfo ?? [];
  return {
    id: fulfillment.id,
    legacy_resource_id: fulfillment.legacyResourceId ?? null,
    name: fulfillment.name ?? null,
    status: fulfillment.status ?? null,
    display_status: fulfillment.displayStatus ?? null,
    created_at: fulfillment.createdAt ?? null,
    updated_at: fulfillment.updatedAt ?? null,
    in_transit_at: fulfillment.inTransitAt ?? null,
    delivered_at: fulfillment.deliveredAt ?? null,
    estimated_delivery_at: fulfillment.estimatedDeliveryAt ?? null,
    total_quantity: fulfillment.totalQuantity ?? null,
    requires_shipping: fulfillment.requiresShipping ?? null,
    tracking_company: tracking[0]?.company ?? null,
    tracking_numbers: tracking
      .map((entry) => entry.number ?? null)
      .filter((value): value is string => value !== null),
    tracking_urls: tracking
      .map((entry) => entry.url ?? null)
      .filter((value): value is string => value !== null),
    location_id: fulfillment.location?.id ?? null,
    location_name: fulfillment.location?.name ?? null,
    service_id: fulfillment.service?.id ?? null,
    service_name: fulfillment.service?.serviceName ?? null,
    order_id: fulfillment.order?.id ?? null,
    order_name: fulfillment.order?.name ?? null,
  };
}

function mapFulfillment(fulfillment: GqlFulfillment) {
  const origin = fulfillment.originAddress;
  const lineItems = fulfillment.fulfillmentLineItems;
  return {
    ...mapFulfillmentSummary(fulfillment),
    origin_address1: origin?.address1 ?? null,
    origin_address2: origin?.address2 ?? null,
    origin_city: origin?.city ?? null,
    origin_zip: origin?.zip ?? null,
    origin_province_code: origin?.provinceCode ?? null,
    origin_country_code: origin?.countryCode ?? null,
    line_items: (lineItems?.nodes ?? []).map((item) => ({
      id: item.id,
      quantity: item.quantity ?? null,
      line_item_id: item.lineItem?.id ?? null,
      title: item.lineItem?.title ?? null,
      sku: item.lineItem?.sku ?? null,
    })),
    line_items_truncated: lineItems?.pageInfo?.hasNextPage ?? false,
  };
}

function mapFulfillmentEvent(event: GqlFulfillmentEvent) {
  return {
    id: event.id,
    status: event.status ?? null,
    message: event.message ?? null,
    happened_at: event.happenedAt ?? null,
    created_at: event.createdAt ?? null,
    estimated_delivery_at: event.estimatedDeliveryAt ?? null,
    address1: event.address1 ?? null,
    city: event.city ?? null,
    province: event.province ?? null,
    country: event.country ?? null,
    zip: event.zip ?? null,
    latitude: event.latitude ?? null,
    longitude: event.longitude ?? null,
  };
}

function mapFulfillmentService(service: GqlFulfillmentService) {
  return {
    id: service.id,
    handle: service.handle ?? null,
    service_name: service.serviceName ?? null,
    type: service.type ?? null,
    callback_url: service.callbackUrl ?? null,
    inventory_management: service.inventoryManagement ?? null,
    tracking_support: service.trackingSupport ?? null,
    requires_shipping_method: service.requiresShippingMethod ?? null,
    location_id: service.location?.id ?? null,
    location_name: service.location?.name ?? null,
  };
}

function mapCarrierService(service: GqlCarrierService) {
  return {
    id: service.id,
    name: service.name ?? null,
    formatted_name: service.formattedName ?? null,
    active: service.active ?? null,
    callback_url: service.callbackUrl ?? null,
    supports_service_discovery: service.supportsServiceDiscovery ?? null,
  };
}

function mapDeliveryProfile(profile: GqlDeliveryProfile) {
  const groups = profile.profileLocationGroups ?? [];
  return {
    id: profile.id,
    name: profile.name ?? null,
    default: profile.default ?? null,
    version: profile.version ?? null,
    active_method_definitions_count: profile.activeMethodDefinitionsCount ?? null,
    locations_without_rates_count: profile.locationsWithoutRatesCount ?? null,
    origin_location_count: profile.originLocationCount ?? null,
    zone_country_count: profile.zoneCountryCount ?? null,
    product_variants_count: profile.productVariantsCount?.count ?? null,
    location_groups: groups.map((group) => ({
      location_group_id: group.locationGroup?.id ?? null,
      locations_count: group.locationGroup?.locationsCount?.count ?? null,
      zones: (group.locationGroupZones?.nodes ?? []).map((entry) => ({
        zone_id: entry.zone?.id ?? null,
        zone_name: entry.zone?.name ?? null,
        countries: (entry.zone?.countries ?? []).map((country) =>
          country.code?.restOfWorld ? 'REST_OF_WORLD' : country.code?.countryCode ?? country.name ?? null
        ),
        rates: (entry.methodDefinitions?.nodes ?? []).map((method) => ({
          id: method.id,
          name: method.name ?? null,
          active: method.active ?? null,
          description: method.description ?? null,
          price: method.rateProvider?.price?.amount ?? null,
          currency_code: method.rateProvider?.price?.currencyCode ?? null,
          carrier_service_id: method.rateProvider?.carrierService?.id ?? null,
          carrier_service_name: method.rateProvider?.carrierService?.name ?? null,
        })),
        rates_truncated: entry.methodDefinitions?.pageInfo?.hasNextPage ?? false,
      })),
      zones_truncated: group.locationGroupZones?.pageInfo?.hasNextPage ?? false,
    })),
  };
}

function mapGiftCard(card: GqlGiftCard) {
  return {
    id: card.id,
    last_characters: card.lastCharacters ?? null,
    masked_code: card.maskedCode ?? null,
    enabled: card.enabled ?? null,
    is_redeemable: card.isRedeemable ?? null,
    deactivated_at: card.deactivatedAt ?? null,
    expires_on: card.expiresOn ?? null,
    balance: card.balance?.amount ?? null,
    initial_value: card.initialValue?.amount ?? null,
    currency_code: card.balance?.currencyCode ?? card.initialValue?.currencyCode ?? null,
    note: card.note ?? null,
    template_suffix: card.templateSuffix ?? null,
    customer_id: card.customer?.id ?? null,
    customer_name: card.customer?.displayName ?? null,
    order_id: card.order?.id ?? null,
    order_name: card.order?.name ?? null,
    recipient_id: card.recipientAttributes?.recipient?.id ?? null,
    recipient_name: card.recipientAttributes?.recipient?.displayName ?? null,
    recipient_preferred_name: card.recipientAttributes?.preferredName ?? null,
    recipient_message: card.recipientAttributes?.message ?? null,
    send_notification_at: card.recipientAttributes?.sendNotificationAt ?? null,
    created_at: card.createdAt ?? null,
    updated_at: card.updatedAt ?? null,
  };
}

function mapDiscountNode(node: GqlDiscountNode) {
  const discount: GqlDiscount = node.discount ?? {};
  const typename = discount.__typename ?? null;
  const method = discountMethod(typename);
  const value = discount.customerGets?.value;
  const effect = value?.effect;
  const items = discount.customerGets?.items;
  const minimum = discount.minimumRequirement;
  const context = discount.context;
  const destination = discount.destinationSelection;
  const buysValue = discount.customerBuys?.value;
  const buysItems = discount.customerBuys?.items;
  const marketIds = (context?.markets?.nodes ?? []).map((market) => market.id);
  return {
    id: typedDiscountId({ id: node.id, method }),
    method,
    discount_type: typename,
    title: discount.title ?? null,
    status: discount.status ?? null,
    summary: discount.summary ?? null,
    starts_at: discount.startsAt ?? null,
    ends_at: discount.endsAt ?? null,
    created_at: discount.createdAt ?? null,
    updated_at: discount.updatedAt ?? null,
    usage_count: discount.asyncUsageCount ?? null,
    discount_classes: discount.discountClasses ?? [],
    tags: discount.tags ?? [],
    combines_with_product_discounts: discount.combinesWith?.productDiscounts ?? null,
    combines_with_order_discounts: discount.combinesWith?.orderDiscounts ?? null,
    combines_with_shipping_discounts: discount.combinesWith?.shippingDiscounts ?? null,
    applies_once_per_customer: discount.appliesOncePerCustomer ?? null,
    usage_limit: discount.usageLimit ?? null,
    codes_count: discount.codesCount?.count ?? null,
    codes: (discount.codes?.nodes ?? [])
      .map((entry) => entry.code ?? null)
      .filter((code): code is string => code !== null),
    eligibility: discountEligibility(context?.__typename),
    customer_ids: (context?.customers ?? []).map((customer) => customer.id),
    segment_ids: (context?.segments ?? []).map((segment) => segment.id),
    market_ids: marketIds,
    markets_truncated: (context?.marketsCount ?? 0) > marketIds.length,
    value_type: discountValueType(value?.__typename),
    percentage: toPercent(value?.percentage ?? effect?.percentage),
    amount: value?.amount?.amount ?? effect?.amount?.amount ?? null,
    amount_currency: value?.amount?.currencyCode ?? effect?.amount?.currencyCode ?? null,
    applies_on_each_item: value?.appliesOnEachItem ?? null,
    quantity: value?.quantity?.quantity ?? null,
    applies_to: discountAppliesTo(items?.__typename),
    product_ids: (items?.products?.nodes ?? []).map((product) => product.id),
    variant_ids: (items?.productVariants?.nodes ?? []).map((variant) => variant.id),
    collection_ids: (items?.collections?.nodes ?? []).map((collection) => collection.id),
    items_truncated: discountItemsTruncated(items),
    buys_type: discountBuysType(buysValue?.__typename),
    buys_quantity: buysValue?.quantity ?? null,
    buys_amount: buysValue?.amount ?? null,
    buys_applies_to: discountAppliesTo(buysItems?.__typename),
    buys_product_ids: (buysItems?.products?.nodes ?? []).map((product) => product.id),
    buys_variant_ids: (buysItems?.productVariants?.nodes ?? []).map((variant) => variant.id),
    buys_collection_ids: (buysItems?.collections?.nodes ?? []).map((collection) => collection.id),
    buys_items_truncated: discountItemsTruncated(buysItems),
    minimum_quantity: minimum?.greaterThanOrEqualToQuantity ?? null,
    minimum_subtotal: minimum?.greaterThanOrEqualToSubtotal?.amount ?? null,
    minimum_subtotal_currency: minimum?.greaterThanOrEqualToSubtotal?.currencyCode ?? null,
    maximum_shipping_price: discount.maximumShippingPrice?.amount ?? null,
    destination_all_countries: destination
      ? destination.__typename === 'DiscountCountryAll'
      : null,
    destination_countries: destination?.countries ?? [],
    uses_per_order_limit: discount.usesPerOrderLimit ?? null,
  };
}

function mapDiscountRedeemCode(code: GqlDiscountRedeemCode) {
  return {
    id: code.id ?? null,
    code: code.code ?? null,
    usage_count: code.asyncUsageCount ?? null,
    created_by_app_id: code.createdBy?.id ?? null,
    created_by_app_title: code.createdBy?.title ?? null,
  };
}

function mapDiscountBulkCreation(creation: GqlDiscountRedeemCodeBulkCreation | null | undefined) {
  return {
    bulk_creation_id: creation?.id ?? null,
    done: creation?.done ?? false,
    codes_count: creation?.codesCount ?? null,
    imported_count: creation?.importedCount ?? null,
    failed_count: creation?.failedCount ?? null,
    created_at: creation?.createdAt ?? null,
    discount_id: creation?.discountCode?.id ?? null,
  };
}

function discountMethod(typename: string | null): 'code' | 'automatic' | null {
  if (typename?.startsWith('DiscountCode')) {
    return 'code';
  }
  if (typename?.startsWith('DiscountAutomatic')) {
    return 'automatic';
  }
  return null;
}

function discountEligibility(typename: string | null | undefined): string | null {
  const map: Record<string, string> = {
    DiscountBuyerSelectionAll: 'ALL',
    DiscountCustomers: 'CUSTOMERS',
    DiscountCustomerSegments: 'SEGMENTS',
    DiscountMarkets: 'MARKETS',
  };
  return typename ? map[typename] ?? null : null;
}

function discountValueType(typename: string | null | undefined): string | null {
  const map: Record<string, string> = {
    DiscountPercentage: 'PERCENTAGE',
    DiscountAmount: 'FIXED_AMOUNT',
    DiscountOnQuantity: 'QUANTITY',
  };
  return typename ? map[typename] ?? null : null;
}

function discountBuysType(typename: string | null | undefined): string | null {
  const map: Record<string, string> = {
    DiscountQuantity: 'QUANTITY',
    DiscountPurchaseAmount: 'AMOUNT',
  };
  return typename ? map[typename] ?? null : null;
}

function discountItemsTruncated(items: GqlDiscountItems | null | undefined): boolean {
  return (
    (items?.products?.pageInfo?.hasNextPage ?? false) ||
    (items?.productVariants?.pageInfo?.hasNextPage ?? false) ||
    (items?.collections?.pageInfo?.hasNextPage ?? false)
  );
}

function clearableValue<T>({
  value,
  clear,
  valueName,
  clearName,
}: {
  value: T | undefined;
  clear: boolean | undefined;
  valueName: string;
  clearName: string;
}): T | null | undefined {
  if (clear !== true) {
    return value;
  }
  if (value !== undefined) {
    throw new Error(`Choose either ${valueName} or ${clearName}, not both. Nothing was changed.`);
  }
  return null;
}

function discountAppliesTo(typename: string | null | undefined): string | null {
  const map: Record<string, string> = {
    AllDiscountItems: 'ALL',
    DiscountProducts: 'PRODUCTS',
    DiscountCollections: 'COLLECTIONS',
  };
  return typename ? map[typename] ?? null : null;
}

function toPercent(fraction: number | null | undefined): number | null {
  if (fraction === null || fraction === undefined) {
    return null;
  }
  return Math.round(fraction * 10000) / 100;
}

function typedDiscountId({
  id,
  method,
}: {
  id: string;
  method: 'code' | 'automatic' | null;
}): string {
  const match = /^gid:\/\/shopify\/DiscountNode\/(\d+)$/.exec(id);
  if (!match || method === null) {
    return id;
  }
  return `gid://shopify/${method === 'code' ? 'DiscountCodeNode' : 'DiscountAutomaticNode'}/${match[1]}`;
}

function readDiscountId({
  value,
  allow,
}: {
  value: string | undefined | null;
  allow: DiscountIdKind[];
}): { id: string; kind: DiscountIdKind; numericId: string } {
  const text = nonEmpty(value);
  if (!text) {
    throw new Error('Provide the discount id.');
  }
  const match = /^gid:\/\/shopify\/(DiscountCodeNode|DiscountAutomaticNode|DiscountNode)\/(\d+)$/.exec(text);
  if (!match) {
    throw new Error(
      `"${text}" is not a full discount id. A plain number is ambiguous because code and automatic discounts are different objects; pass the full id such as "gid://shopify/DiscountCodeNode/123" or "gid://shopify/DiscountAutomaticNode/456" returned by list_discounts, get_discount or find_discount_by_code. Nothing was changed.`
    );
  }
  const kind = DISCOUNT_ID_KINDS[match[1]];
  if (!allow.includes(kind)) {
    throw new Error(
      `"${text}" is ${kind === 'automatic' ? 'an automatic discount' : 'a code discount'}, but this action works only on ${allow.includes('code') ? 'code discounts (gid://shopify/DiscountCodeNode/…)' : 'automatic discounts (gid://shopify/DiscountAutomaticNode/…)'}. Nothing was changed.`
    );
  }
  return { id: text, kind, numericId: match[2] };
}

function toDiscountCodeNodeId(value: string | undefined | null): string {
  const text = nonEmpty(value);
  if (text && /^\d+$/.test(text)) {
    return `gid://shopify/DiscountCodeNode/${text}`;
  }
  const { kind, id, numericId } = readDiscountId({ value, allow: ['code', 'node'] });
  return kind === 'node' ? `gid://shopify/DiscountCodeNode/${numericId}` : id;
}

function buildDiscountValue({
  valueType,
  value,
  appliesOnEachItem,
}: {
  valueType: string | undefined;
  value: number | undefined;
  appliesOnEachItem: boolean | undefined;
}): Record<string, unknown> | undefined {
  if (valueType === undefined && value === undefined) {
    if (appliesOnEachItem !== undefined) {
      throw new Error('applies_on_each_item needs value_type FIXED_AMOUNT and a value. Nothing was changed.');
    }
    return undefined;
  }
  if (valueType === undefined || value === undefined) {
    throw new Error('Set both value_type and value together. Nothing was changed.');
  }
  if (valueType === 'PERCENTAGE') {
    if (!(value > 0 && value <= 100)) {
      throw new Error('A percentage value must be above 0 and at most 100, for example 15 for 15% off. Nothing was changed.');
    }
    if (appliesOnEachItem !== undefined) {
      throw new Error('applies_on_each_item applies only to FIXED_AMOUNT discounts. Nothing was changed.');
    }
    return { percentage: Math.round(value * 100) / 10000 };
  }
  if (valueType === 'FIXED_AMOUNT') {
    if (!(value > 0)) {
      throw new Error('A fixed amount must be above 0, for example 10 for 10.00 off in the shop currency. Nothing was changed.');
    }
    return compact({
      discountAmount: compact({ amount: String(value), appliesOnEachItem }),
    });
  }
  throw new Error(`Unknown value_type "${valueType}". Use PERCENTAGE or FIXED_AMOUNT.`);
}

function buildDiscountItems({
  appliesTo,
  productIdsToAdd,
  productIdsToRemove,
  variantIdsToAdd,
  variantIdsToRemove,
  collectionIdsToAdd,
  collectionIdsToRemove,
}: {
  appliesTo: string | undefined;
  productIdsToAdd: unknown;
  productIdsToRemove: unknown;
  variantIdsToAdd: unknown;
  variantIdsToRemove: unknown;
  collectionIdsToAdd: unknown;
  collectionIdsToRemove: unknown;
}): Record<string, unknown> | undefined {
  const products = compact({
    productsToAdd: toGidList({ type: 'Product', value: productIdsToAdd }),
    productsToRemove: toGidList({ type: 'Product', value: productIdsToRemove }),
    productVariantsToAdd: toGidList({ type: 'ProductVariant', value: variantIdsToAdd }),
    productVariantsToRemove: toGidList({ type: 'ProductVariant', value: variantIdsToRemove }),
  });
  const collections = compact({
    add: toGidList({ type: 'Collection', value: collectionIdsToAdd }),
    remove: toGidList({ type: 'Collection', value: collectionIdsToRemove }),
  });
  const hasProducts = Object.keys(products).length > 0;
  const hasCollections = Object.keys(collections).length > 0;
  if (hasProducts && hasCollections) {
    throw new Error('A discount applies to products or to collections, not both. Nothing was changed.');
  }
  const target = appliesTo ?? (hasProducts ? 'PRODUCTS' : hasCollections ? 'COLLECTIONS' : undefined);
  if (target === undefined) {
    return undefined;
  }
  if (target === 'ALL') {
    if (hasProducts || hasCollections) {
      throw new Error('applies_to ALL cannot be combined with product, variant or collection ids. Nothing was changed.');
    }
    return { all: true };
  }
  if (target === 'PRODUCTS') {
    if (hasCollections) {
      throw new Error('applies_to PRODUCTS takes product or variant ids, not collection ids. Nothing was changed.');
    }
    if (!hasProducts) {
      throw new Error('applies_to PRODUCTS needs at least one product or variant id. Nothing was changed.');
    }
    return { products };
  }
  if (target === 'COLLECTIONS') {
    if (hasProducts) {
      throw new Error('applies_to COLLECTIONS takes collection ids, not product ids. Nothing was changed.');
    }
    if (!hasCollections) {
      throw new Error('applies_to COLLECTIONS needs at least one collection id. Nothing was changed.');
    }
    return { collections };
  }
  throw new Error(`Unknown applies_to "${target}". Use ALL, PRODUCTS or COLLECTIONS.`);
}

function buildDiscountContext({
  eligibility,
  customerIdsToAdd,
  customerIdsToRemove,
  segmentIdsToAdd,
  segmentIdsToRemove,
}: {
  eligibility: string | undefined;
  customerIdsToAdd: unknown;
  customerIdsToRemove: unknown;
  segmentIdsToAdd: unknown;
  segmentIdsToRemove: unknown;
}): Record<string, unknown> | undefined {
  const customers = compact({
    add: toGidList({ type: 'Customer', value: customerIdsToAdd }),
    remove: toGidList({ type: 'Customer', value: customerIdsToRemove }),
  });
  const segments = compact({
    add: toGidList({ type: 'Segment', value: segmentIdsToAdd }),
    remove: toGidList({ type: 'Segment', value: segmentIdsToRemove }),
  });
  const hasCustomers = Object.keys(customers).length > 0;
  const hasSegments = Object.keys(segments).length > 0;
  if (hasCustomers && hasSegments) {
    throw new Error('Eligibility is either specific customers or customer segments, not both. Nothing was changed.');
  }
  const target = eligibility ?? (hasCustomers ? 'CUSTOMERS' : hasSegments ? 'SEGMENTS' : undefined);
  if (target === undefined) {
    return undefined;
  }
  if (target === 'ALL') {
    if (hasCustomers || hasSegments) {
      throw new Error('eligibility ALL cannot be combined with customer or segment ids. Nothing was changed.');
    }
    return { all: 'ALL' };
  }
  if (target === 'CUSTOMERS') {
    if (!hasCustomers || hasSegments) {
      throw new Error('eligibility CUSTOMERS needs customer ids (and no segment ids). Nothing was changed.');
    }
    return { customers };
  }
  if (target === 'SEGMENTS') {
    if (!hasSegments || hasCustomers) {
      throw new Error('eligibility SEGMENTS needs segment ids (and no customer ids). Nothing was changed.');
    }
    return { customerSegments: segments };
  }
  throw new Error(`Unknown eligibility "${target}". Use ALL, CUSTOMERS or SEGMENTS.`);
}

function readRedeemCodeSearch(value: string | undefined | null): string | undefined {
  const text = nonEmpty(value);
  if (!text) {
    return undefined;
  }
  const unsupported = [...text.matchAll(/([A-Za-z_]+):/g)]
    .map((match) => match[1])
    .filter((field) => field.toLowerCase() !== 'times_used');
  if (unsupported.length > 0) {
    throw new Error(
      `The redeem code search supports only the times_used filter (for example "times_used:0") and plain text matched against the code (for example "SUMMER"). Shopify ignores other filters such as "${unsupported[0]}:" and would then match EVERY code of the discount. Nothing was changed.`
    );
  }
  return text;
}

function buildMinimumRequirement({
  kind,
  value,
}: {
  kind: string | undefined;
  value: number | undefined;
}): Record<string, unknown> | undefined {
  if (kind === undefined) {
    if (value !== undefined) {
      throw new Error('Set minimum_requirement (SUBTOTAL or QUANTITY) together with minimum_value. Nothing was changed.');
    }
    return undefined;
  }
  if (kind === 'NONE') {
    return {
      quantity: { greaterThanOrEqualToQuantity: null },
      subtotal: { greaterThanOrEqualToSubtotal: null },
    };
  }
  if (value === undefined || !(value > 0)) {
    throw new Error('minimum_value must be above 0 when a minimum requirement is set. Nothing was changed.');
  }
  if (kind === 'SUBTOTAL') {
    return {
      subtotal: { greaterThanOrEqualToSubtotal: String(value) },
      quantity: { greaterThanOrEqualToQuantity: null },
    };
  }
  if (kind === 'QUANTITY') {
    if (!Number.isInteger(value)) {
      throw new Error('A minimum quantity must be a whole number. Nothing was changed.');
    }
    return {
      quantity: { greaterThanOrEqualToQuantity: String(value) },
      subtotal: { greaterThanOrEqualToSubtotal: null },
    };
  }
  throw new Error(`Unknown minimum_requirement "${kind}". Use NONE, SUBTOTAL or QUANTITY.`);
}

function buildCombinesWith({
  productDiscounts,
  orderDiscounts,
  shippingDiscounts,
}: {
  productDiscounts: boolean | undefined;
  orderDiscounts: boolean | undefined;
  shippingDiscounts: boolean | undefined;
}): Record<string, boolean> | undefined {
  const values = [productDiscounts, orderDiscounts, shippingDiscounts];
  if (values.every((entry) => entry === undefined)) {
    return undefined;
  }
  if (productDiscounts === undefined || orderDiscounts === undefined || shippingDiscounts === undefined) {
    throw new Error(
      'combinesWith is replaced as a whole: set all three of combines_with_product_discounts, combines_with_order_discounts and combines_with_shipping_discounts. Nothing was changed.'
    );
  }
  return { productDiscounts, orderDiscounts, shippingDiscounts };
}

function buildFulfillmentOrderLineItems(value: unknown): Record<string, unknown>[] | undefined {
  const records = readRecords(value);
  if (records.length === 0) {
    return undefined;
  }
  return records.map((record) => {
    const id = readText(record['fulfillment_order_line_item_id']);
    const quantity = readNumber(record['quantity']);
    if (!id || quantity === undefined || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error(
        'Every line item needs a fulfillment_order_line_item_id and a whole-number quantity of 1 or more. Nothing was changed.'
      );
    }
    return {
      id: toGid({ type: 'FulfillmentOrderLineItem', id }),
      quantity,
    };
  });
}

function nonEmptyList(value: unknown): string[] | undefined {
  const list = readStringList(value);
  return list && list.length > 0 ? list : undefined;
}

function readIsoDate(value: string | undefined | null): string | undefined {
  const text = nonEmpty(value);
  if (text === undefined) {
    return undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`"${text}" is not a date in the form YYYY-MM-DD. Nothing was changed.`);
  }
  return text;
}

function discountFragments({
  types,
  detail,
}: {
  types: string[];
  detail: boolean;
}): string {
  return types
    .map((type) => `... on ${type} { ${discountTypeFields({ type, detail })} }`)
    .join(' ');
}

function discountTypeFields({ type, detail }: { type: string; detail: boolean }): string {
  const kind = type.replace(/^Discount(Code|Automatic)/, '');
  const parts = [DISCOUNT_COMMON_FIELDS];
  if (kind !== 'App') {
    parts.push('summary');
  }
  if (type.startsWith('DiscountCode')) {
    parts.push(detail ? DISCOUNT_CODE_DETAIL_FIELDS : DISCOUNT_CODE_SUMMARY_FIELDS);
  }
  if (detail && (kind === 'Basic' || kind === 'Bxgy')) {
    parts.push(DISCOUNT_CUSTOMER_GETS_FIELDS);
  }
  if (detail && (kind === 'Basic' || kind === 'FreeShipping')) {
    parts.push(DISCOUNT_MINIMUM_FIELDS);
  }
  if (detail && kind === 'FreeShipping') {
    parts.push(DISCOUNT_SHIPPING_FIELDS);
  }
  if (detail && kind === 'Bxgy') {
    parts.push('usesPerOrderLimit', DISCOUNT_CUSTOMER_BUYS_FIELDS);
  }
  return parts.join(' ');
}

function fulfillmentOrderLineItemsProp({ description }: { description: string }) {
  return Property.Array({
    displayName: 'Line Items',
    description,
    required: false,
    properties: {
      fulfillment_order_line_item_id: Property.ShortText({
        displayName: 'Fulfillment Order Line Item ID',
        description:
          'The fulfillment order line item id from list_order_fulfillment_orders or get_fulfillment_order (line_items[].id), for example "gid://shopify/FulfillmentOrderLineItem/1234". This is not the order line item id.',
        required: true,
      }),
      quantity: Property.Number({
        displayName: 'Quantity',
        description: 'How many units of this line item, 1 or more and at most its remaining_quantity.',
        required: true,
      }),
    },
  });
}

function idListProp({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.Array({
    displayName,
    description,
    required: false,
  });
}

function mapBlog(blog: GqlBlog) {
  return {
    id: blog.id,
    title: blog.title ?? null,
    handle: blog.handle ?? null,
    comment_policy: blog.commentPolicy ?? null,
    template_suffix: blog.templateSuffix ?? null,
    articles_count: blog.articlesCount?.count ?? null,
    feed_path: blog.feed?.path ?? null,
    feed_location: blog.feed?.location ?? null,
    created_at: blog.createdAt ?? null,
    updated_at: blog.updatedAt ?? null,
  };
}

function mapBlogDetail(blog: GqlBlog) {
  return {
    ...mapBlog(blog),
    recent_article_tags: blog.tags ?? [],
  };
}

function mapArticleSummary(article: GqlArticle) {
  return {
    id: article.id,
    title: article.title ?? null,
    handle: article.handle ?? null,
    author_name: article.author?.name ?? null,
    blog_id: article.blog?.id ?? null,
    blog_title: article.blog?.title ?? null,
    summary_html: article.summary ?? null,
    tags: joinTags(article.tags),
    is_published: article.isPublished ?? null,
    published_at: article.publishedAt ?? null,
    template_suffix: article.templateSuffix ?? null,
    image_url: article.image?.url ?? null,
    image_alt_text: article.image?.altText ?? null,
    comments_count: article.commentsCount?.count ?? null,
    created_at: article.createdAt ?? null,
    updated_at: article.updatedAt ?? null,
  };
}

function mapArticle(article: GqlArticle) {
  return {
    ...mapArticleSummary(article),
    body_html: article.body ?? null,
  };
}

function mapComment(comment: GqlComment) {
  return {
    id: comment.id,
    status: comment.status ?? null,
    body: comment.body ?? null,
    body_html: comment.bodyHtml ?? null,
    is_published: comment.isPublished ?? null,
    published_at: comment.publishedAt ?? null,
    author_name: comment.author?.name ?? null,
    author_email: comment.author?.email ?? null,
    ip: comment.ip ?? null,
    user_agent: comment.userAgent ?? null,
    article_id: comment.article?.id ?? null,
    article_title: comment.article?.title ?? null,
    created_at: comment.createdAt ?? null,
    updated_at: comment.updatedAt ?? null,
  };
}

function mapPageSummary(page: GqlPage) {
  return {
    id: page.id,
    title: page.title ?? null,
    handle: page.handle ?? null,
    body_summary: page.bodySummary ?? null,
    is_published: page.isPublished ?? null,
    published_at: page.publishedAt ?? null,
    template_suffix: page.templateSuffix ?? null,
    created_at: page.createdAt ?? null,
    updated_at: page.updatedAt ?? null,
  };
}

function mapPage(page: GqlPage) {
  return {
    ...mapPageSummary(page),
    body_html: page.body ?? null,
  };
}

function mapUrlRedirect(redirect: GqlUrlRedirect) {
  return {
    id: redirect.id,
    path: redirect.path ?? null,
    target: redirect.target ?? null,
  };
}

function mapTheme(theme: GqlTheme) {
  return {
    id: theme.id,
    name: theme.name ?? null,
    role: theme.role ?? null,
    prefix: theme.prefix ?? null,
    processing: theme.processing ?? null,
    processing_failed: theme.processingFailed ?? null,
    theme_store_id: theme.themeStoreId ?? null,
    created_at: theme.createdAt ?? null,
    updated_at: theme.updatedAt ?? null,
  };
}

function mapThemeFile(file: GqlThemeFile) {
  const body = file.body ?? {};
  return {
    filename: file.filename ?? null,
    content_type: file.contentType ?? null,
    size: readNumber(file.size) ?? null,
    checksum_md5: file.checksumMd5 ?? null,
    body_type: themeFileBodyType(body.__typename),
    content: body.content ?? null,
    content_base64: body.contentBase64 ?? null,
    url: body.url ?? null,
    created_at: file.createdAt ?? null,
    updated_at: file.updatedAt ?? null,
  };
}

function themeFileBodyType(typename: string | null | undefined): string | null {
  const types: Record<string, string> = {
    OnlineStoreThemeFileBodyText: 'TEXT',
    OnlineStoreThemeFileBodyBase64: 'BASE64',
    OnlineStoreThemeFileBodyUrl: 'URL',
  };
  return typename ? types[typename] ?? null : null;
}

function mapThemeFileResult(file: GqlThemeFileResult) {
  return {
    filename: file.filename ?? null,
    size: readNumber(file.size) ?? null,
    checksum_md5: file.checksumMd5 ?? null,
    created_at: file.createdAt ?? null,
    updated_at: file.updatedAt ?? null,
  };
}

function mapThemeFileSummary(file: GqlThemeFileSummary) {
  return {
    filename: file.filename ?? null,
    content_type: file.contentType ?? null,
    size: readNumber(file.size) ?? null,
    checksum_md5: file.checksumMd5 ?? null,
    created_at: file.createdAt ?? null,
    updated_at: file.updatedAt ?? null,
  };
}

function mapMetafield(metafield: GqlMetafield) {
  return {
    id: metafield.id,
    legacy_resource_id: metafield.legacyResourceId ?? null,
    namespace: metafield.namespace ?? null,
    key: metafield.key ?? null,
    type: metafield.type ?? null,
    value: metafield.value ?? null,
    compare_digest: metafield.compareDigest ?? null,
    owner_type: metafield.ownerType ?? null,
    owner_id: metafield.owner?.id ?? null,
    definition_id: metafield.definition?.id ?? null,
    definition_name: metafield.definition?.name ?? null,
    created_at: metafield.createdAt ?? null,
    updated_at: metafield.updatedAt ?? null,
  };
}

function mapValidation(validation: GqlValidation) {
  return {
    name: validation.name ?? null,
    type: validation.type ?? null,
    value: validation.value ?? null,
  };
}

function mapMetafieldDefinition(definition: GqlMetafieldDefinition) {
  return {
    id: definition.id,
    name: definition.name ?? null,
    namespace: definition.namespace ?? null,
    key: definition.key ?? null,
    description: definition.description ?? null,
    owner_type: definition.ownerType ?? null,
    type: definition.type?.name ?? null,
    type_category: definition.type?.category ?? null,
    pinned_position: definition.pinnedPosition ?? null,
    validation_status: definition.validationStatus ?? null,
    validations: (definition.validations ?? []).map(mapValidation),
    metafields_count: definition.metafieldsCount ?? null,
    admin_access: definition.access?.admin ?? null,
    storefront_access: definition.access?.storefront ?? null,
    customer_account_access: definition.access?.customerAccount ?? null,
    admin_filterable: definition.capabilities?.adminFilterable?.enabled ?? null,
    smart_collection_condition: definition.capabilities?.smartCollectionCondition?.enabled ?? null,
    unique_values: definition.capabilities?.uniqueValues?.enabled ?? null,
  };
}

function mapMetafieldDefinitionType(type: GqlMetafieldDefinitionType) {
  return {
    name: type.name ?? null,
    category: type.category ?? null,
    supports_definition_migrations: type.supportsDefinitionMigrations ?? null,
    supported_validations: (type.supportedValidations ?? []).map((validation) => ({
      name: validation.name ?? null,
      type: validation.type ?? null,
    })),
  };
}

function mapStandardMetafieldTemplate(template: GqlStandardMetafieldTemplate) {
  return {
    id: template.id,
    namespace: template.namespace ?? null,
    key: template.key ?? null,
    name: template.name ?? null,
    description: template.description ?? null,
    owner_types: template.ownerTypes ?? [],
    type: template.type?.name ?? null,
    visible_to_storefront_api: template.visibleToStorefrontApi ?? null,
    validations: (template.validations ?? []).map(mapValidation),
  };
}

function mapMetaobject(metaobject: GqlMetaobject) {
  const fields = (metaobject.fields ?? []).map((field) => ({
    key: field.key ?? null,
    type: field.type ?? null,
    value: field.value ?? null,
  }));
  const values: Record<string, string | null> = {};
  for (const field of fields) {
    if (field.key) {
      values[field.key] = field.value;
    }
  }
  return {
    id: metaobject.id,
    type: metaobject.type ?? null,
    handle: metaobject.handle ?? null,
    display_name: metaobject.displayName ?? null,
    status: metaobject.capabilities?.publishable?.status ?? null,
    template_suffix: metaobject.capabilities?.onlineStore?.templateSuffix ?? null,
    definition_id: metaobject.definition?.id ?? null,
    definition_name: metaobject.definition?.name ?? null,
    fields,
    values,
    created_at: metaobject.createdAt ?? null,
    updated_at: metaobject.updatedAt ?? null,
  };
}

function mapMetaobjectDefinition(definition: GqlMetaobjectDefinition) {
  return {
    id: definition.id,
    type: definition.type ?? null,
    name: definition.name ?? null,
    description: definition.description ?? null,
    display_name_key: definition.displayNameKey ?? null,
    metaobjects_count: definition.metaobjectsCount ?? null,
    has_thumbnail_field: definition.hasThumbnailField ?? null,
    publishable: definition.capabilities?.publishable?.enabled ?? null,
    translatable: definition.capabilities?.translatable?.enabled ?? null,
    renderable: definition.capabilities?.renderable?.enabled ?? null,
    online_store: definition.capabilities?.onlineStore?.enabled ?? null,
    admin_access: definition.access?.admin ?? null,
    storefront_access: definition.access?.storefront ?? null,
    field_definitions: (definition.fieldDefinitions ?? []).map((field) => ({
      key: field.key ?? null,
      name: field.name ?? null,
      description: field.description ?? null,
      required: field.required ?? null,
      type: field.type?.name ?? null,
    })),
    created_at: definition.createdAt ?? null,
    updated_at: definition.updatedAt ?? null,
  };
}

function requireGid({
  value,
  label,
  example,
  hint,
}: {
  value: string | undefined | null;
  label: string;
  example: string;
  hint: string;
}): string {
  const trimmed = (value ?? '').trim();
  if (!/^gid:\/\/shopify\/[A-Za-z]+\/[^/\s]+$/.test(trimmed)) {
    throw new Error(
      `${label} "${trimmed}" is not a full Shopify id. Pass the complete id, for example "${example}"; ${hint} Nothing was changed.`
    );
  }
  return trimmed;
}

function legacyIdFilter(value: string | undefined | null): string | undefined {
  const trimmed = nonEmpty(value);
  if (!trimmed) {
    return undefined;
  }
  const match = /(\d+)$/.exec(trimmed);
  if (!match) {
    throw new Error(`"${trimmed}" is not a numeric or gid://shopify/… id.`);
  }
  return match[1];
}

function joinSearch(parts: (string | undefined)[]): string | undefined {
  const present = parts.filter((part): part is string => part !== undefined && part.length > 0);
  return present.length > 0 ? present.join(' ') : undefined;
}

function metafieldOwnerTypeProp({
  required,
  description,
}: {
  required: boolean;
  description: string;
}) {
  return Property.StaticDropdown({
    displayName: 'Owner Type',
    description,
    required,
    options: {
      options: METAFIELD_OWNER_TYPES.map((value) => ({ label: value, value })),
    },
  });
}

function mapMarketingEvent(event: GqlMarketingEvent) {
  return {
    id: event.id,
    legacy_resource_id: event.legacyResourceId ?? null,
    type: event.type ?? null,
    remote_id: event.remoteId ?? null,
    description: event.description ?? null,
    marketing_channel_type: event.marketingChannelType ?? null,
    source_and_medium: event.sourceAndMedium ?? null,
    channel_handle: event.channelHandle ?? null,
    started_at: event.startedAt ?? null,
    ended_at: event.endedAt ?? null,
    scheduled_to_end_at: event.scheduledToEndAt ?? null,
    manage_url: event.manageUrl ?? null,
    preview_url: event.previewUrl ?? null,
    utm_campaign: event.utmCampaign ?? null,
    utm_medium: event.utmMedium ?? null,
    utm_source: event.utmSource ?? null,
    app_id: event.app?.id ?? null,
    app_title: event.app?.title ?? null,
  };
}

function mapMarketingActivity(activity: GqlMarketingActivity) {
  return {
    id: activity.id,
    title: activity.title ?? null,
    status: activity.status ?? null,
    status_label: activity.statusLabel ?? null,
    tactic: activity.tactic ?? null,
    marketing_channel_type: activity.marketingChannelType ?? null,
    source_and_medium: activity.sourceAndMedium ?? null,
    is_external: activity.isExternal ?? null,
    hierarchy_level: activity.hierarchyLevel ?? null,
    parent_remote_id: activity.parentRemoteId ?? null,
    parent_activity_id: activity.parentActivityId ?? null,
    url_parameter_value: activity.urlParameterValue ?? null,
    activity_list_url: activity.activityListUrl ?? null,
    utm_campaign: activity.utmParameters?.campaign ?? null,
    utm_source: activity.utmParameters?.source ?? null,
    utm_medium: activity.utmParameters?.medium ?? null,
    budget_type: activity.budget?.budgetType ?? null,
    budget_amount: activity.budget?.total?.amount ?? null,
    budget_currency_code: activity.budget?.total?.currencyCode ?? null,
    ad_spend_amount: activity.adSpend?.amount ?? null,
    ad_spend_currency_code: activity.adSpend?.currencyCode ?? null,
    marketing_event_id: activity.marketingEvent?.id ?? null,
    remote_id: activity.marketingEvent?.remoteId ?? null,
    manage_url: activity.marketingEvent?.manageUrl ?? null,
    preview_url: activity.marketingEvent?.previewUrl ?? null,
    started_at: activity.marketingEvent?.startedAt ?? null,
    ended_at: activity.marketingEvent?.endedAt ?? null,
    scheduled_to_end_at: activity.marketingEvent?.scheduledToEndAt ?? null,
    status_transitioned_at: activity.statusTransitionedAt ?? null,
    created_at: activity.createdAt ?? null,
    updated_at: activity.updatedAt ?? null,
  };
}

function mapMarketingEngagement(engagement: GqlMarketingEngagement) {
  return {
    occurred_on: engagement.occurredOn ?? null,
    utc_offset: engagement.utcOffset ?? null,
    channel_handle: engagement.channelHandle ?? null,
    marketing_activity_id: engagement.marketingActivity?.id ?? null,
    marketing_activity_title: engagement.marketingActivity?.title ?? null,
    impressions_count: engagement.impressionsCount ?? null,
    views_count: engagement.viewsCount ?? null,
    clicks_count: engagement.clicksCount ?? null,
    shares_count: engagement.sharesCount ?? null,
    favorites_count: engagement.favoritesCount ?? null,
    comments_count: engagement.commentsCount ?? null,
    unsubscribes_count: engagement.unsubscribesCount ?? null,
    complaints_count: engagement.complaintsCount ?? null,
    fails_count: engagement.failsCount ?? null,
    sends_count: engagement.sendsCount ?? null,
    unique_views_count: engagement.uniqueViewsCount ?? null,
    unique_clicks_count: engagement.uniqueClicksCount ?? null,
    sessions_count: engagement.sessionsCount ?? null,
    orders: engagement.orders ?? null,
    first_time_customers: engagement.firstTimeCustomers ?? null,
    returning_customers: engagement.returningCustomers ?? null,
    primary_conversions: engagement.primaryConversions ?? null,
    all_conversions: engagement.allConversions ?? null,
    ad_spend_amount: engagement.adSpend?.amount ?? null,
    ad_spend_currency_code: engagement.adSpend?.currencyCode ?? null,
    sales_amount: engagement.sales?.amount ?? null,
    sales_currency_code: engagement.sales?.currencyCode ?? null,
  };
}

function mapScriptTag(tag: GqlScriptTag) {
  return {
    id: tag.id,
    legacy_resource_id: tag.legacyResourceId ?? null,
    src: tag.src ?? null,
    display_scope: tag.displayScope ?? null,
    cache: tag.cache ?? null,
    created_at: tag.createdAt ?? null,
    updated_at: tag.updatedAt ?? null,
  };
}

function mapEvent(event: GqlEvent) {
  return {
    id: event.id,
    event_type: event.__typename ?? null,
    action: event.action ?? null,
    message: event.message ?? null,
    secondary_message: event.secondaryMessage ?? null,
    raw_message: event.rawMessage ?? null,
    subject_id: event.subjectId ?? null,
    subject_type: event.subjectType ?? null,
    author: event.author ?? null,
    app_title: event.appTitle ?? null,
    attribute_to_app: event.attributeToApp ?? null,
    attribute_to_user: event.attributeToUser ?? null,
    critical_alert: event.criticalAlert ?? null,
    edited: event.edited ?? null,
    created_at: event.createdAt ?? null,
  };
}

function mapBulkOperation(operation: GqlBulkOperation) {
  return {
    id: operation.id,
    status: operation.status ?? null,
    type: operation.type ?? null,
    error_code: operation.errorCode ?? null,
    created_at: operation.createdAt ?? null,
    completed_at: operation.completedAt ?? null,
    object_count: operation.objectCount ?? null,
    root_object_count: operation.rootObjectCount ?? null,
    file_size: operation.fileSize ?? null,
    url: operation.url ?? null,
    partial_data_url: operation.partialDataUrl ?? null,
    query: operation.query ?? null,
  };
}

function mapCurrencySetting(setting: GqlCurrencySetting) {
  return {
    currency_code: setting.currencyCode ?? null,
    currency_name: setting.currencyName ?? null,
    enabled: setting.enabled ?? null,
    manual_rate: setting.manualRate ?? null,
    rate_updated_at: setting.rateUpdatedAt ?? null,
  };
}

function mapShopPolicy(policy: GqlShopPolicy) {
  return {
    id: policy.id,
    type: policy.type ?? null,
    title: policy.title ?? null,
    url: policy.url ?? null,
    body: policy.body ?? null,
    created_at: policy.createdAt ?? null,
    updated_at: policy.updatedAt ?? null,
  };
}

function mapLocale(locale: GqlLocale) {
  return {
    iso_code: locale.isoCode ?? null,
    name: locale.name ?? null,
  };
}

function mapDomain(domain: GqlDomain) {
  return {
    id: domain.id,
    host: domain.host ?? null,
    url: domain.url ?? null,
    ssl_enabled: domain.sslEnabled ?? null,
    default_locale: domain.localization?.defaultLocale ?? null,
    alternate_locales: domain.localization?.alternateLocales ?? [],
    country: domain.localization?.country ?? null,
    web_presence_id: domain.marketWebPresence?.id ?? null,
    web_presence_subfolder_suffix: domain.marketWebPresence?.subfolderSuffix ?? null,
    web_presence_root_urls: (domain.marketWebPresence?.rootUrls ?? []).map((root) => ({
      locale: root.locale ?? null,
      url: root.url ?? null,
    })),
  };
}

function mapCustomerAccountPage(page: GqlCustomerAccountPage) {
  return {
    id: page.id,
    page_kind: page.__typename ?? null,
    handle: page.handle ?? null,
    title: page.title ?? null,
    default_cursor: page.defaultCursor ?? null,
    page_type: page.pageType ?? null,
    app_extension_uuid: page.appExtensionUuid ?? null,
  };
}

function mapConsentPolicy(policy: GqlConsentPolicy) {
  return {
    id: policy.id,
    country_code: policy.countryCode ?? null,
    region_code: policy.regionCode ?? null,
    consent_required: policy.consentRequired ?? null,
    data_sale_opt_out_required: policy.dataSaleOptOutRequired ?? null,
    shop_id: policy.shopId ?? null,
  };
}

function mapConsentPolicyRegion(region: GqlConsentPolicyRegion) {
  return {
    country_code: region.countryCode ?? null,
    region_code: region.regionCode ?? null,
  };
}

function mapCatalog(catalog: GqlCatalog) {
  return {
    id: catalog.id,
    catalog_type: catalog.__typename ?? null,
    title: catalog.title ?? null,
    status: catalog.status ?? null,
    price_list_id: catalog.priceList?.id ?? null,
    price_list_name: catalog.priceList?.name ?? null,
    price_list_currency: catalog.priceList?.currency ?? null,
    publication_id: catalog.publication?.id ?? null,
    markets_count: catalog.marketsCount?.count ?? null,
    company_locations_count: catalog.companyLocationsCount?.count ?? null,
  };
}

function mapBusinessEntity(entity: GqlBusinessEntity) {
  return {
    id: entity.id,
    display_name: entity.displayName ?? null,
    company_name: entity.companyName ?? null,
    primary: entity.primary ?? null,
    archived: entity.archived ?? null,
    legal_entity_id: entity.legalEntityId ?? null,
    address1: entity.address?.address1 ?? null,
    address2: entity.address?.address2 ?? null,
    city: entity.address?.city ?? null,
    province: entity.address?.province ?? null,
    zip: entity.address?.zip ?? null,
    country_code: entity.address?.countryCode ?? null,
  };
}

function mapPaymentTermsTemplate(template: GqlPaymentTermsTemplate) {
  return {
    id: template.id,
    name: template.name ?? null,
    translated_name: template.translatedName ?? null,
    description: template.description ?? null,
    due_in_days: template.dueInDays ?? null,
    payment_terms_type: template.paymentTermsType ?? null,
  };
}

function mapDispute(dispute: GqlDispute) {
  return {
    id: dispute.id,
    legacy_resource_id: dispute.legacyResourceId ?? null,
    status: dispute.status ?? null,
    type: dispute.type ?? null,
    reason: dispute.reasonDetails?.reason ?? null,
    network_reason_code: dispute.reasonDetails?.networkReasonCode ?? null,
    amount: dispute.amount?.amount ?? null,
    currency_code: dispute.amount?.currencyCode ?? null,
    initiated_at: dispute.initiatedAt ?? null,
    evidence_due_by: dispute.evidenceDueBy ?? null,
    evidence_sent_on: dispute.evidenceSentOn ?? null,
    finalized_on: dispute.finalizedOn ?? null,
    order_id: dispute.order?.id ?? null,
    order_name: dispute.order?.name ?? null,
  };
}

function mapShopPayReceipt(receipt: GqlShopPayReceipt) {
  return {
    token: receipt.token ?? null,
    source_identifier: receipt.sourceIdentifier ?? null,
    created_at: receipt.createdAt ?? null,
    processing_state: receipt.processingStatus?.state ?? null,
    processing_message: receipt.processingStatus?.message ?? null,
    processing_error_code: receipt.processingStatus?.errorCode ?? null,
    order_id: receipt.order?.id ?? null,
    order_name: receipt.order?.name ?? null,
    presentment_currency: receipt.paymentRequest?.presentmentCurrency ?? null,
    total: receipt.paymentRequest?.total?.amount ?? null,
    subtotal: receipt.paymentRequest?.subtotal?.amount ?? null,
    total_tax: receipt.paymentRequest?.totalTax?.amount ?? null,
  };
}

function mapWebPresence(presence: GqlWebPresence) {
  return {
    id: presence.id,
    kind: presence.domain ? 'domain' : 'subfolder',
    subfolder_suffix: presence.subfolderSuffix ?? null,
    domain_id: presence.domain?.id ?? null,
    domain_host: presence.domain?.host ?? null,
    domain_url: presence.domain?.url ?? null,
    default_locale: presence.defaultLocale?.locale ?? null,
    root_urls: (presence.rootUrls ?? []).map((root) => ({
      locale: root.locale ?? null,
      url: root.url ?? null,
    })),
  };
}

function mapSavedSearch(search: GqlSavedSearch) {
  return {
    id: search.id,
    name: search.name ?? null,
    query: search.query ?? null,
    search_terms: search.searchTerms ?? null,
    resource_type: search.resourceType ?? null,
  };
}

function buildMoneyInput({
  amount,
  currency,
  label,
}: {
  amount: number | undefined | null;
  currency: string | undefined | null;
  label: string;
}): { amount: string; currencyCode: string } | undefined {
  if (amount === undefined || amount === null) {
    return undefined;
  }
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} must be 0 or more. Nothing was changed.`);
  }
  const code = nonEmpty(currency)?.toUpperCase();
  if (!code || !/^[A-Z]{3}$/.test(code)) {
    throw new Error(`${label} needs currency set to a 3-letter ISO code such as "USD". Nothing was changed.`);
  }
  return { amount: String(amount), currencyCode: code };
}

function buildUtm({
  campaign,
  source,
  medium,
}: {
  campaign: string | undefined | null;
  source: string | undefined | null;
  medium: string | undefined | null;
}): { campaign: string; source: string; medium: string } | undefined {
  const values = { campaign: nonEmpty(campaign), source: nonEmpty(source), medium: nonEmpty(medium) };
  const given = Object.values(values).filter((value) => value !== undefined).length;
  if (given === 0) {
    return undefined;
  }
  if (values.campaign === undefined || values.source === undefined || values.medium === undefined) {
    throw new Error('UTM parameters go together: set utm_campaign, utm_source and utm_medium, or none of them. Nothing was changed.');
  }
  return { campaign: values.campaign, source: values.source, medium: values.medium };
}

function readMarketingActivityTarget({
  marketingActivityId,
  remoteId,
}: {
  marketingActivityId: string | undefined | null;
  remoteId: string | undefined | null;
}): { marketingActivityId?: string; remoteId?: string } {
  const id = nonEmpty(marketingActivityId);
  const remote = nonEmpty(remoteId);
  if (id && remote) {
    throw new Error('Pass either marketing_activity_id or remote_id, not both. Nothing was changed.');
  }
  if (id) {
    return { marketingActivityId: toGid({ type: 'MarketingActivity', id }) };
  }
  if (remote) {
    return { remoteId: remote };
  }
  throw new Error('Pass marketing_activity_id or remote_id to say which marketing activity to use. Nothing was changed.');
}

function staticChoiceProp({
  displayName,
  description,
  required,
  values,
}: {
  displayName: string;
  description: string;
  required: boolean;
  values: string[];
}) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: values.map((value) => ({ label: value, value })),
    },
  });
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

const FULFILLMENT_ORDER_LINE_ITEM_LIMIT = 50;

const FULFILLMENT_ORDER_FIELDS = `id status requestStatus createdAt updatedAt fulfillAt fulfillBy orderId orderName assignedLocation { name location { id name } } destination { firstName lastName company address1 address2 city province zip countryCode phone email } deliveryMethod { methodType presentedName } fulfillmentHolds { id reason reasonNotes displayReason handle heldByRequestingApp } supportedActions { action } lineItems(first: ${FULFILLMENT_ORDER_LINE_ITEM_LIMIT}) { pageInfo { hasNextPage } nodes { id sku productTitle variantTitle totalQuantity remainingQuantity requiresShipping inventoryItemId lineItem { id } variant { id } } }`;

const FULFILLMENT_SUMMARY_FIELDS =
  'id legacyResourceId name status displayStatus createdAt updatedAt inTransitAt deliveredAt estimatedDeliveryAt totalQuantity requiresShipping trackingInfo(first: 10) { company number url } location { id name } service { id serviceName } order { id name }';

const FULFILLMENT_FIELDS = `${FULFILLMENT_SUMMARY_FIELDS} originAddress { address1 address2 city zip provinceCode countryCode } fulfillmentLineItems(first: 50) { pageInfo { hasNextPage } nodes { id quantity lineItem { id title sku } } }`;

const FULFILLMENT_EVENT_FIELDS =
  'id status message happenedAt createdAt estimatedDeliveryAt address1 city province country zip latitude longitude';

const FULFILLMENT_SERVICE_FIELDS =
  'id handle serviceName type callbackUrl inventoryManagement trackingSupport requiresShippingMethod location { id name }';

const CARRIER_SERVICE_FIELDS =
  'id name formattedName active callbackUrl supportsServiceDiscovery';

const DELIVERY_PROFILE_FIELDS =
  'id name default version activeMethodDefinitionsCount locationsWithoutRatesCount originLocationCount zoneCountryCount productVariantsCount { count } profileLocationGroups { locationGroup { id locationsCount { count } } locationGroupZones(first: 2) { pageInfo { hasNextPage } nodes { zone { id name countries { name code { countryCode restOfWorld } } } methodDefinitions(first: 3) { pageInfo { hasNextPage } nodes { id name active description rateProvider { __typename ... on DeliveryRateDefinition { price { amount currencyCode } } ... on DeliveryParticipant { carrierService { id name } } } } } } } }';

const GIFT_CARD_FIELDS =
  'id lastCharacters maskedCode enabled isRedeemable deactivatedAt expiresOn createdAt updatedAt note templateSuffix balance { amount currencyCode } initialValue { amount currencyCode } customer { id displayName } order { id name } recipientAttributes { preferredName message sendNotificationAt recipient { id displayName } }';

const DISCOUNT_MARKETS_LIMIT = 10;

const DISCOUNT_COMMON_FIELDS = `title status startsAt endsAt createdAt updatedAt asyncUsageCount discountClasses tags combinesWith { productDiscounts orderDiscounts shippingDiscounts } context { __typename ... on DiscountBuyerSelectionAll { all } ... on DiscountCustomers { customers { id } } ... on DiscountCustomerSegments { segments { id } } ... on DiscountMarkets { marketsCount markets(first: ${DISCOUNT_MARKETS_LIMIT}) { nodes { id } } } }`;

const DISCOUNT_ITEMS_FIELDS =
  'items { __typename ... on DiscountProducts { products(first: 25) { pageInfo { hasNextPage } nodes { id } } productVariants(first: 25) { pageInfo { hasNextPage } nodes { id } } } ... on DiscountCollections { collections(first: 25) { pageInfo { hasNextPage } nodes { id } } } }';

const DISCOUNT_CUSTOMER_BUYS_FIELDS = `customerBuys { value { __typename ... on DiscountQuantity { quantity } ... on DiscountPurchaseAmount { amount } } ${DISCOUNT_ITEMS_FIELDS} }`;

const DISCOUNT_CODE_SUMMARY_FIELDS =
  'appliesOncePerCustomer usageLimit codesCount { count } codes(first: 1) { nodes { code } }';

const DISCOUNT_CODE_DETAIL_FIELDS =
  'appliesOncePerCustomer usageLimit codesCount { count } codes(first: 10) { nodes { code } }';

const DISCOUNT_CUSTOMER_GETS_FIELDS = `customerGets { value { __typename ... on DiscountPercentage { percentage } ... on DiscountAmount { amount { amount currencyCode } appliesOnEachItem } ... on DiscountOnQuantity { quantity { quantity } effect { __typename ... on DiscountPercentage { percentage } ... on DiscountAmount { amount { amount currencyCode } } } } } ${DISCOUNT_ITEMS_FIELDS} }`;

const DISCOUNT_MINIMUM_FIELDS =
  'minimumRequirement { __typename ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity } ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount currencyCode } } }';

const DISCOUNT_SHIPPING_FIELDS =
  'maximumShippingPrice { amount currencyCode } destinationSelection { __typename ... on DiscountCountries { countries } ... on DiscountCountryAll { allCountries } }';

const CODE_DISCOUNT_TYPES = [
  'DiscountCodeBasic',
  'DiscountCodeBxgy',
  'DiscountCodeFreeShipping',
  'DiscountCodeApp',
];

const AUTOMATIC_DISCOUNT_TYPES = [
  'DiscountAutomaticBasic',
  'DiscountAutomaticBxgy',
  'DiscountAutomaticFreeShipping',
  'DiscountAutomaticApp',
];

const DISCOUNT_SUMMARY_FIELDS = `__typename ${discountFragments({
  types: [...CODE_DISCOUNT_TYPES, ...AUTOMATIC_DISCOUNT_TYPES],
  detail: false,
})}`;

const DISCOUNT_DETAIL_FIELDS = `__typename ${discountFragments({
  types: [...CODE_DISCOUNT_TYPES, ...AUTOMATIC_DISCOUNT_TYPES],
  detail: true,
})}`;

const CODE_DISCOUNT_DETAIL_FIELDS = `__typename ${discountFragments({
  types: CODE_DISCOUNT_TYPES,
  detail: true,
})}`;

const DISCOUNT_ID_KINDS: Record<string, DiscountIdKind> = {
  DiscountCodeNode: 'code',
  DiscountAutomaticNode: 'automatic',
  DiscountNode: 'node',
};

const MAX_REDEEM_CODES_PER_CALL = 250;

const BLOG_FIELDS =
  'id title handle commentPolicy templateSuffix createdAt updatedAt feed { path location } articlesCount { count }';

const BLOG_DETAIL_FIELDS = `${BLOG_FIELDS} tags`;

const ARTICLE_SUMMARY_FIELDS =
  'id title handle summary tags isPublished publishedAt templateSuffix createdAt updatedAt author { name } blog { id title } image { url altText } commentsCount { count }';

const ARTICLE_FIELDS = `${ARTICLE_SUMMARY_FIELDS} body`;

const COMMENT_FIELDS =
  'id status body bodyHtml isPublished publishedAt createdAt updatedAt ip userAgent author { name email } article { id title }';

const PAGE_SUMMARY_FIELDS =
  'id title handle bodySummary isPublished publishedAt templateSuffix createdAt updatedAt';

const PAGE_FIELDS = `${PAGE_SUMMARY_FIELDS} body`;

const URL_REDIRECT_FIELDS = 'id path target';

const THEME_FIELDS =
  'id name role prefix processing processingFailed themeStoreId createdAt updatedAt';

const THEME_FILE_FIELDS =
  'filename contentType size checksumMd5 createdAt updatedAt body { __typename ... on OnlineStoreThemeFileBodyText { content } ... on OnlineStoreThemeFileBodyBase64 { contentBase64 } ... on OnlineStoreThemeFileBodyUrl { url } }';

const THEME_FILE_RESULT_FIELDS = 'filename size checksumMd5 createdAt updatedAt';

const THEME_FILE_SUMMARY_FIELDS = 'filename contentType size checksumMd5 createdAt updatedAt';

const METAFIELD_FIELDS =
  'id legacyResourceId namespace key type value compareDigest ownerType createdAt updatedAt owner { __typename ... on Node { id } } definition { id name }';

const METAFIELD_DEFINITION_FIELDS =
  'id name namespace key description ownerType pinnedPosition validationStatus metafieldsCount type { name category } validations { name type value } access { admin storefront customerAccount } capabilities { adminFilterable { enabled } smartCollectionCondition { enabled } uniqueValues { enabled } }';

const METAFIELD_DEFINITION_TYPE_FIELDS =
  'name category supportsDefinitionMigrations supportedValidations { name type }';

const STANDARD_METAFIELD_TEMPLATE_FIELDS =
  'id namespace key name description ownerTypes visibleToStorefrontApi type { name } validations { name type value }';

const METAOBJECT_FIELDS =
  'id type handle displayName createdAt updatedAt definition { id name } capabilities { publishable { status } onlineStore { templateSuffix } } fields { key type value }';

const METAOBJECT_DEFINITION_FIELDS =
  'id type name description displayNameKey metaobjectsCount hasThumbnailField createdAt updatedAt access { admin storefront } capabilities { publishable { enabled } translatable { enabled } renderable { enabled } onlineStore { enabled } } fieldDefinitions { key name description required type { name } }';

const METAFIELD_OWNER_TYPES = [
  'PRODUCT',
  'PRODUCTVARIANT',
  'COLLECTION',
  'CUSTOMER',
  'ORDER',
  'DRAFTORDER',
  'COMPANY',
  'COMPANY_LOCATION',
  'LOCATION',
  'MARKET',
  'PAGE',
  'BLOG',
  'ARTICLE',
  'SHOP',
  'DISCOUNT',
  'SELLING_PLAN',
  'GIFT_CARD_TRANSACTION',
];

const MAX_METAFIELDS_PER_CALL = 25;

const MAX_THEME_FILES_PER_CALL = 50;

const MARKETING_EVENT_FIELDS =
  'id legacyResourceId type remoteId description marketingChannelType sourceAndMedium channelHandle startedAt endedAt scheduledToEndAt manageUrl previewUrl utmCampaign utmMedium utmSource app { id title }';

const MARKETING_ACTIVITY_FIELDS = `id title status statusLabel tactic marketingChannelType sourceAndMedium isExternal hierarchyLevel parentRemoteId parentActivityId urlParameterValue activityListUrl statusTransitionedAt createdAt updatedAt utmParameters { campaign source medium } budget { budgetType total { amount currencyCode } } adSpend { amount currencyCode } marketingEvent { id remoteId manageUrl previewUrl startedAt endedAt scheduledToEndAt }`;

const MARKETING_ENGAGEMENT_FIELDS =
  'occurredOn utcOffset channelHandle impressionsCount viewsCount clicksCount sharesCount favoritesCount commentsCount unsubscribesCount complaintsCount failsCount sendsCount uniqueViewsCount uniqueClicksCount sessionsCount orders firstTimeCustomers returningCustomers primaryConversions allConversions adSpend { amount currencyCode } sales { amount currencyCode } marketingActivity { id title }';

const SCRIPT_TAG_FIELDS = 'id legacyResourceId src displayScope cache createdAt updatedAt';

const EVENT_FIELDS =
  '__typename id action message createdAt appTitle attributeToApp attributeToUser criticalAlert ... on BasicEvent { subjectId subjectType author secondaryMessage } ... on CommentEvent { rawMessage edited }';

const BULK_OPERATION_FIELDS =
  'id status type errorCode createdAt completedAt objectCount rootObjectCount fileSize url partialDataUrl query';

const CURRENCY_SETTING_FIELDS = 'currencyCode currencyName enabled manualRate rateUpdatedAt';

const SHOP_POLICY_FIELDS = 'id type title url body createdAt updatedAt';

const LOCALE_FIELDS = 'isoCode name';

const DOMAIN_FIELDS =
  'id host url sslEnabled localization { defaultLocale alternateLocales country } marketWebPresence { id subfolderSuffix rootUrls { locale url } }';

const CUSTOMER_ACCOUNT_PAGE_FIELDS =
  '__typename id handle title defaultCursor ... on CustomerAccountNativePage { pageType } ... on CustomerAccountAppExtensionPage { appExtensionUuid }';

const CONSENT_POLICY_FIELDS = 'id countryCode regionCode consentRequired dataSaleOptOutRequired shopId';

const CONSENT_POLICY_REGION_FIELDS = 'countryCode regionCode';

const CATALOG_FIELDS =
  '__typename id title status priceList { id name currency } publication { id } ... on MarketCatalog { marketsCount { count } } ... on CompanyLocationCatalog { companyLocationsCount { count } }';

const BUSINESS_ENTITY_FIELDS =
  'id displayName companyName primary archived legalEntityId address { address1 address2 city province zip countryCode }';

const PAYMENT_TERMS_TEMPLATE_FIELDS = 'id name translatedName description dueInDays paymentTermsType';

const DISPUTE_FIELDS =
  'id legacyResourceId status type initiatedAt evidenceDueBy evidenceSentOn finalizedOn amount { amount currencyCode } reasonDetails { reason networkReasonCode } order { id name }';

const SHOP_PAY_RECEIPT_FIELDS =
  'token sourceIdentifier createdAt processingStatus { state message errorCode } order { id name } paymentRequest { presentmentCurrency total { amount currencyCode } subtotal { amount currencyCode } totalTax { amount currencyCode } }';

const WEB_PRESENCE_FIELDS =
  'id subfolderSuffix domain { id host url } defaultLocale { locale } rootUrls { locale url }';

const SAVED_SEARCH_FIELDS = 'id name query searchTerms resourceType';

const MARKETING_TACTICS = [
  'ABANDONED_CART',
  'AD',
  'AFFILIATE',
  'LINK',
  'LOYALTY',
  'MESSAGE',
  'NEWSLETTER',
  'NOTIFICATION',
  'POST',
  'RETARGETING',
  'TRANSACTIONAL',
  'STOREFRONT_APP',
  'SEO',
];

const MARKETING_CHANNELS = ['SEARCH', 'DISPLAY', 'SOCIAL', 'EMAIL', 'REFERRAL'];

const MARKETING_EXTERNAL_STATUSES = ['ACTIVE', 'INACTIVE', 'PAUSED', 'SCHEDULED', 'DELETED_EXTERNALLY', 'UNDEFINED'];

const MARKETING_HIERARCHY_LEVELS = ['CAMPAIGN', 'AD_GROUP', 'AD'];

const MARKETING_BUDGET_TYPES = ['DAILY', 'LIFETIME'];


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
  FULFILLMENT_ORDER_FIELDS,
  FULFILLMENT_SUMMARY_FIELDS,
  FULFILLMENT_FIELDS,
  FULFILLMENT_EVENT_FIELDS,
  FULFILLMENT_SERVICE_FIELDS,
  CARRIER_SERVICE_FIELDS,
  DELIVERY_PROFILE_FIELDS,
  GIFT_CARD_FIELDS,
  DISCOUNT_SUMMARY_FIELDS,
  DISCOUNT_DETAIL_FIELDS,
  CODE_DISCOUNT_DETAIL_FIELDS,
  CODE_DISCOUNT_TYPES,
  MAX_REDEEM_CODES_PER_CALL,
  BLOG_FIELDS,
  BLOG_DETAIL_FIELDS,
  ARTICLE_SUMMARY_FIELDS,
  ARTICLE_FIELDS,
  COMMENT_FIELDS,
  PAGE_SUMMARY_FIELDS,
  PAGE_FIELDS,
  URL_REDIRECT_FIELDS,
  THEME_FIELDS,
  THEME_FILE_FIELDS,
  THEME_FILE_RESULT_FIELDS,
  THEME_FILE_SUMMARY_FIELDS,
  METAFIELD_FIELDS,
  METAFIELD_DEFINITION_FIELDS,
  METAFIELD_DEFINITION_TYPE_FIELDS,
  STANDARD_METAFIELD_TEMPLATE_FIELDS,
  METAOBJECT_FIELDS,
  METAOBJECT_DEFINITION_FIELDS,
  METAFIELD_OWNER_TYPES,
  MAX_METAFIELDS_PER_CALL,
  MAX_THEME_FILES_PER_CALL,
  MARKETING_EVENT_FIELDS,
  MARKETING_ACTIVITY_FIELDS,
  MARKETING_ENGAGEMENT_FIELDS,
  SCRIPT_TAG_FIELDS,
  EVENT_FIELDS,
  BULK_OPERATION_FIELDS,
  CURRENCY_SETTING_FIELDS,
  SHOP_POLICY_FIELDS,
  LOCALE_FIELDS,
  DOMAIN_FIELDS,
  CUSTOMER_ACCOUNT_PAGE_FIELDS,
  CONSENT_POLICY_FIELDS,
  CONSENT_POLICY_REGION_FIELDS,
  CATALOG_FIELDS,
  BUSINESS_ENTITY_FIELDS,
  PAYMENT_TERMS_TEMPLATE_FIELDS,
  DISPUTE_FIELDS,
  SHOP_PAY_RECEIPT_FIELDS,
  WEB_PRESENCE_FIELDS,
  SAVED_SEARCH_FIELDS,
  MARKETING_TACTICS,
  MARKETING_CHANNELS,
  MARKETING_EXTERNAL_STATUSES,
  MARKETING_HIERARCHY_LEVELS,
  MARKETING_BUDGET_TYPES,
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
  readDiscountId,
  toDiscountCodeNodeId,
  readRedeemCodeSearch,
  buildDiscountValue,
  buildDiscountItems,
  buildDiscountContext,
  buildMinimumRequirement,
  buildCombinesWith,
  buildFulfillmentOrderLineItems,
  readIsoDate,
  nonEmptyList,
  clearableValue,
  requireGid,
  legacyIdFilter,
  joinSearch,
  buildMoneyInput,
  buildUtm,
  readMarketingActivityTarget,
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
  mapFulfillmentOrder,
  mapFulfillmentOrderOrNull,
  mapFulfillmentSummary,
  mapFulfillment,
  mapFulfillmentEvent,
  mapFulfillmentService,
  mapCarrierService,
  mapDeliveryProfile,
  mapGiftCard,
  mapDiscountNode,
  mapDiscountRedeemCode,
  mapDiscountBulkCreation,
  mapBlog,
  mapBlogDetail,
  mapArticleSummary,
  mapArticle,
  mapComment,
  mapPageSummary,
  mapPage,
  mapUrlRedirect,
  mapTheme,
  mapThemeFile,
  mapThemeFileResult,
  mapThemeFileSummary,
  mapMetafield,
  mapMetafieldDefinition,
  mapMetafieldDefinitionType,
  mapStandardMetafieldTemplate,
  mapMetaobject,
  mapMetaobjectDefinition,
  mapMarketingEvent,
  mapMarketingActivity,
  mapMarketingEngagement,
  mapScriptTag,
  mapEvent,
  mapBulkOperation,
  mapCurrencySetting,
  mapShopPolicy,
  mapLocale,
  mapDomain,
  mapCustomerAccountPage,
  mapConsentPolicy,
  mapConsentPolicyRegion,
  mapCatalog,
  mapBusinessEntity,
  mapPaymentTermsTemplate,
  mapDispute,
  mapShopPayReceipt,
  mapWebPresence,
  mapSavedSearch,
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
  fulfillmentOrderLineItems: fulfillmentOrderLineItemsProp,
  idList: idListProp,
  metafieldOwnerType: metafieldOwnerTypeProp,
  staticChoice: staticChoiceProp,
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

export type GqlRef = {
  id: string;
  name?: string | null;
};

export type GqlFulfillmentOrder = {
  id: string;
  status?: string | null;
  requestStatus?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  fulfillAt?: string | null;
  fulfillBy?: string | null;
  orderId?: string | null;
  orderName?: string | null;
  assignedLocation?: { name?: string | null; location?: GqlRef | null } | null;
  destination?: {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    province?: string | null;
    zip?: string | null;
    countryCode?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  deliveryMethod?: { methodType?: string | null; presentedName?: string | null } | null;
  fulfillmentHolds?: GqlFulfillmentHold[] | null;
  supportedActions?: { action?: string | null }[] | null;
  lineItems?: GqlConnection<{
    id: string;
    sku?: string | null;
    productTitle?: string | null;
    variantTitle?: string | null;
    totalQuantity?: number | null;
    remainingQuantity?: number | null;
    requiresShipping?: boolean | null;
    inventoryItemId?: string | null;
    lineItem?: { id: string } | null;
    variant?: { id: string } | null;
  }> | null;
};

export type GqlFulfillmentHold = {
  id: string;
  reason?: string | null;
  reasonNotes?: string | null;
  displayReason?: string | null;
  handle?: string | null;
  heldByRequestingApp?: boolean | null;
};

export type GqlFulfillment = {
  id: string;
  legacyResourceId?: string | null;
  name?: string | null;
  status?: string | null;
  displayStatus?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  inTransitAt?: string | null;
  deliveredAt?: string | null;
  estimatedDeliveryAt?: string | null;
  totalQuantity?: number | null;
  requiresShipping?: boolean | null;
  trackingInfo?: { company?: string | null; number?: string | null; url?: string | null }[] | null;
  location?: GqlRef | null;
  service?: { id: string; serviceName?: string | null } | null;
  order?: GqlRef | null;
  originAddress?: {
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    zip?: string | null;
    provinceCode?: string | null;
    countryCode?: string | null;
  } | null;
  fulfillmentLineItems?: GqlConnection<{
    id: string;
    quantity?: number | null;
    lineItem?: { id: string; title?: string | null; sku?: string | null } | null;
  }> | null;
};

export type GqlFulfillmentEvent = {
  id: string;
  status?: string | null;
  message?: string | null;
  happenedAt?: string | null;
  createdAt?: string | null;
  estimatedDeliveryAt?: string | null;
  address1?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type GqlFulfillmentService = {
  id: string;
  handle?: string | null;
  serviceName?: string | null;
  type?: string | null;
  callbackUrl?: string | null;
  inventoryManagement?: boolean | null;
  trackingSupport?: boolean | null;
  requiresShippingMethod?: boolean | null;
  location?: GqlRef | null;
};

export type GqlCarrierService = {
  id: string;
  name?: string | null;
  formattedName?: string | null;
  active?: boolean | null;
  callbackUrl?: string | null;
  supportsServiceDiscovery?: boolean | null;
};

export type GqlDeliveryProfile = {
  id: string;
  name?: string | null;
  default?: boolean | null;
  version?: number | null;
  activeMethodDefinitionsCount?: number | null;
  locationsWithoutRatesCount?: number | null;
  originLocationCount?: number | null;
  zoneCountryCount?: number | null;
  productVariantsCount?: GqlCount | null;
  profileLocationGroups?: {
    locationGroup?: { id: string; locationsCount?: GqlCount | null } | null;
    locationGroupZones?: GqlConnection<{
      zone?: {
        id: string;
        name?: string | null;
        countries?: {
          name?: string | null;
          code?: { countryCode?: string | null; restOfWorld?: boolean | null } | null;
        }[] | null;
      } | null;
      methodDefinitions?: GqlConnection<{
        id: string;
        name?: string | null;
        active?: boolean | null;
        description?: string | null;
        rateProvider?: {
          __typename?: string;
          price?: GqlMoneyV2 | null;
          carrierService?: GqlRef | null;
        } | null;
      }> | null;
    }> | null;
  }[] | null;
};

export type GqlGiftCard = {
  id: string;
  lastCharacters?: string | null;
  maskedCode?: string | null;
  enabled?: boolean | null;
  isRedeemable?: boolean | null;
  deactivatedAt?: string | null;
  expiresOn?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  note?: string | null;
  templateSuffix?: string | null;
  balance?: GqlMoneyV2 | null;
  initialValue?: GqlMoneyV2 | null;
  customer?: { id: string; displayName?: string | null } | null;
  order?: GqlRef | null;
  recipientAttributes?: {
    preferredName?: string | null;
    message?: string | null;
    sendNotificationAt?: string | null;
    recipient?: { id: string; displayName?: string | null } | null;
  } | null;
};

export type GqlDiscountNode = {
  id: string;
  discount?: GqlDiscount | null;
};

export type GqlDiscount = {
  __typename?: string;
  title?: string | null;
  status?: string | null;
  summary?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  asyncUsageCount?: number | null;
  discountClasses?: string[] | null;
  tags?: string[] | null;
  combinesWith?: {
    productDiscounts?: boolean | null;
    orderDiscounts?: boolean | null;
    shippingDiscounts?: boolean | null;
  } | null;
  context?: {
    __typename?: string;
    customers?: { id: string }[] | null;
    segments?: { id: string }[] | null;
    marketsCount?: number | null;
    markets?: GqlConnection<{ id: string }> | null;
  } | null;
  appliesOncePerCustomer?: boolean | null;
  usageLimit?: number | null;
  codesCount?: GqlCount | null;
  codes?: GqlConnection<GqlDiscountRedeemCode> | null;
  customerGets?: {
    value?: GqlDiscountValue | null;
    items?: GqlDiscountItems | null;
  } | null;
  customerBuys?: {
    value?: {
      __typename?: string;
      quantity?: string | null;
      amount?: string | null;
    } | null;
    items?: GqlDiscountItems | null;
  } | null;
  minimumRequirement?: {
    __typename?: string;
    greaterThanOrEqualToQuantity?: string | null;
    greaterThanOrEqualToSubtotal?: GqlMoneyV2 | null;
  } | null;
  maximumShippingPrice?: GqlMoneyV2 | null;
  destinationSelection?: {
    __typename?: string;
    countries?: string[] | null;
    allCountries?: boolean | null;
  } | null;
  usesPerOrderLimit?: number | null;
};

export type GqlDiscountItems = {
  __typename?: string;
  products?: GqlConnection<{ id: string }> | null;
  productVariants?: GqlConnection<{ id: string }> | null;
  collections?: GqlConnection<{ id: string }> | null;
};

export type GqlDiscountValue = {
  __typename?: string;
  percentage?: number | null;
  amount?: GqlMoneyV2 | null;
  appliesOnEachItem?: boolean | null;
  quantity?: { quantity?: string | null } | null;
  effect?: {
    __typename?: string;
    percentage?: number | null;
    amount?: GqlMoneyV2 | null;
  } | null;
};

export type GqlDiscountRedeemCode = {
  id?: string | null;
  code?: string | null;
  asyncUsageCount?: number | null;
  createdBy?: { id?: string | null; title?: string | null } | null;
};

export type GqlDiscountRedeemCodeBulkCreation = {
  id?: string | null;
  done?: boolean | null;
  codesCount?: number | null;
  importedCount?: number | null;
  failedCount?: number | null;
  createdAt?: string | null;
  discountCode?: { id: string } | null;
};

export type DiscountIdKind = 'code' | 'automatic' | 'node';

export type GqlBlog = {
  id: string;
  title?: string | null;
  handle?: string | null;
  commentPolicy?: string | null;
  templateSuffix?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  feed?: { path?: string | null; location?: string | null } | null;
  articlesCount?: GqlCount | null;
  tags?: string[] | null;
};

export type GqlArticle = {
  id: string;
  title?: string | null;
  handle?: string | null;
  summary?: string | null;
  body?: string | null;
  tags?: string[] | null;
  isPublished?: boolean | null;
  publishedAt?: string | null;
  templateSuffix?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  author?: { name?: string | null } | null;
  blog?: { id?: string | null; title?: string | null } | null;
  image?: { url?: string | null; altText?: string | null } | null;
  commentsCount?: GqlCount | null;
};

export type GqlComment = {
  id: string;
  status?: string | null;
  body?: string | null;
  bodyHtml?: string | null;
  isPublished?: boolean | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  author?: { name?: string | null; email?: string | null } | null;
  article?: { id?: string | null; title?: string | null } | null;
};

export type GqlPage = {
  id: string;
  title?: string | null;
  handle?: string | null;
  body?: string | null;
  bodySummary?: string | null;
  isPublished?: boolean | null;
  publishedAt?: string | null;
  templateSuffix?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GqlUrlRedirect = {
  id: string;
  path?: string | null;
  target?: string | null;
};

export type GqlTheme = {
  id: string;
  name?: string | null;
  role?: string | null;
  prefix?: string | null;
  processing?: boolean | null;
  processingFailed?: boolean | null;
  themeStoreId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GqlThemeFile = {
  filename?: string | null;
  contentType?: string | null;
  size?: string | null;
  checksumMd5?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  body?: {
    __typename?: string;
    content?: string | null;
    contentBase64?: string | null;
    url?: string | null;
  } | null;
};

export type GqlThemeFileResult = {
  filename?: string | null;
  size?: string | null;
  checksumMd5?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GqlThemeFileSummary = GqlThemeFileResult & {
  contentType?: string | null;
};

export type GqlMetafield = {
  id: string;
  legacyResourceId?: string | null;
  namespace?: string | null;
  key?: string | null;
  type?: string | null;
  value?: string | null;
  compareDigest?: string | null;
  ownerType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  owner?: { __typename?: string; id?: string | null } | null;
  definition?: { id?: string | null; name?: string | null } | null;
};

export type GqlValidation = {
  name?: string | null;
  type?: string | null;
  value?: string | null;
};

export type GqlMetafieldDefinition = {
  id: string;
  name?: string | null;
  namespace?: string | null;
  key?: string | null;
  description?: string | null;
  ownerType?: string | null;
  pinnedPosition?: number | null;
  validationStatus?: string | null;
  metafieldsCount?: number | null;
  type?: { name?: string | null; category?: string | null } | null;
  validations?: GqlValidation[] | null;
  access?: {
    admin?: string | null;
    storefront?: string | null;
    customerAccount?: string | null;
  } | null;
  capabilities?: {
    adminFilterable?: { enabled?: boolean | null } | null;
    smartCollectionCondition?: { enabled?: boolean | null } | null;
    uniqueValues?: { enabled?: boolean | null } | null;
  } | null;
};

export type GqlMetafieldDefinitionType = {
  name?: string | null;
  category?: string | null;
  supportsDefinitionMigrations?: boolean | null;
  supportedValidations?: { name?: string | null; type?: string | null }[] | null;
};

export type GqlStandardMetafieldTemplate = {
  id: string;
  namespace?: string | null;
  key?: string | null;
  name?: string | null;
  description?: string | null;
  ownerTypes?: string[] | null;
  visibleToStorefrontApi?: boolean | null;
  type?: { name?: string | null } | null;
  validations?: GqlValidation[] | null;
};

export type GqlMetaobject = {
  id: string;
  type?: string | null;
  handle?: string | null;
  displayName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  definition?: { id?: string | null; name?: string | null } | null;
  capabilities?: {
    publishable?: { status?: string | null } | null;
    onlineStore?: { templateSuffix?: string | null } | null;
  } | null;
  fields?: { key?: string | null; type?: string | null; value?: string | null }[] | null;
};

export type GqlMetaobjectDefinition = {
  id: string;
  type?: string | null;
  name?: string | null;
  description?: string | null;
  displayNameKey?: string | null;
  metaobjectsCount?: number | null;
  hasThumbnailField?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  access?: { admin?: string | null; storefront?: string | null } | null;
  capabilities?: {
    publishable?: { enabled?: boolean | null } | null;
    translatable?: { enabled?: boolean | null } | null;
    renderable?: { enabled?: boolean | null } | null;
    onlineStore?: { enabled?: boolean | null } | null;
  } | null;
  fieldDefinitions?: {
    key?: string | null;
    name?: string | null;
    description?: string | null;
    required?: boolean | null;
    type?: { name?: string | null } | null;
  }[] | null;
};

export type GqlMarketingEvent = {
  id: string;
  legacyResourceId?: string | null;
  type?: string | null;
  remoteId?: string | null;
  description?: string | null;
  marketingChannelType?: string | null;
  sourceAndMedium?: string | null;
  channelHandle?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  scheduledToEndAt?: string | null;
  manageUrl?: string | null;
  previewUrl?: string | null;
  utmCampaign?: string | null;
  utmMedium?: string | null;
  utmSource?: string | null;
  app?: { id?: string | null; title?: string | null } | null;
};

export type GqlMarketingActivity = {
  id: string;
  title?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  tactic?: string | null;
  marketingChannelType?: string | null;
  sourceAndMedium?: string | null;
  isExternal?: boolean | null;
  hierarchyLevel?: string | null;
  parentRemoteId?: string | null;
  parentActivityId?: string | null;
  urlParameterValue?: string | null;
  activityListUrl?: string | null;
  statusTransitionedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  utmParameters?: { campaign?: string | null; source?: string | null; medium?: string | null } | null;
  budget?: { budgetType?: string | null; total?: GqlMoneyV2 | null } | null;
  adSpend?: GqlMoneyV2 | null;
  marketingEvent?: {
    id?: string | null;
    remoteId?: string | null;
    manageUrl?: string | null;
    previewUrl?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;
    scheduledToEndAt?: string | null;
  } | null;
};

export type GqlMarketingEngagement = {
  occurredOn?: string | null;
  utcOffset?: string | null;
  channelHandle?: string | null;
  impressionsCount?: number | null;
  viewsCount?: number | null;
  clicksCount?: number | null;
  sharesCount?: number | null;
  favoritesCount?: number | null;
  commentsCount?: number | null;
  unsubscribesCount?: number | null;
  complaintsCount?: number | null;
  failsCount?: number | null;
  sendsCount?: number | null;
  uniqueViewsCount?: number | null;
  uniqueClicksCount?: number | null;
  sessionsCount?: number | null;
  orders?: string | null;
  firstTimeCustomers?: string | null;
  returningCustomers?: string | null;
  primaryConversions?: string | null;
  allConversions?: string | null;
  adSpend?: GqlMoneyV2 | null;
  sales?: GqlMoneyV2 | null;
  marketingActivity?: { id?: string | null; title?: string | null } | null;
};

export type GqlScriptTag = {
  id: string;
  legacyResourceId?: string | null;
  src?: string | null;
  displayScope?: string | null;
  cache?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GqlEvent = {
  __typename?: string | null;
  id: string;
  action?: string | null;
  message?: string | null;
  secondaryMessage?: string | null;
  rawMessage?: string | null;
  subjectId?: string | null;
  subjectType?: string | null;
  author?: string | null;
  appTitle?: string | null;
  attributeToApp?: boolean | null;
  attributeToUser?: boolean | null;
  criticalAlert?: boolean | null;
  edited?: boolean | null;
  createdAt?: string | null;
};

export type GqlBulkOperation = {
  id: string;
  status?: string | null;
  type?: string | null;
  errorCode?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
  objectCount?: string | null;
  rootObjectCount?: string | null;
  fileSize?: string | null;
  url?: string | null;
  partialDataUrl?: string | null;
  query?: string | null;
};

export type GqlCurrencySetting = {
  currencyCode?: string | null;
  currencyName?: string | null;
  enabled?: boolean | null;
  manualRate?: string | null;
  rateUpdatedAt?: string | null;
};

export type GqlShopPolicy = {
  id: string;
  type?: string | null;
  title?: string | null;
  url?: string | null;
  body?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GqlLocale = {
  isoCode?: string | null;
  name?: string | null;
};

export type GqlDomain = {
  id: string;
  host?: string | null;
  url?: string | null;
  sslEnabled?: boolean | null;
  localization?: {
    defaultLocale?: string | null;
    alternateLocales?: string[] | null;
    country?: string | null;
  } | null;
  marketWebPresence?: {
    id?: string | null;
    subfolderSuffix?: string | null;
    rootUrls?: { locale?: string | null; url?: string | null }[] | null;
  } | null;
};

export type GqlCustomerAccountPage = {
  __typename?: string | null;
  id: string;
  handle?: string | null;
  title?: string | null;
  defaultCursor?: string | null;
  pageType?: string | null;
  appExtensionUuid?: string | null;
};

export type GqlConsentPolicy = {
  id: string;
  countryCode?: string | null;
  regionCode?: string | null;
  consentRequired?: boolean | null;
  dataSaleOptOutRequired?: boolean | null;
  shopId?: string | null;
};

export type GqlConsentPolicyRegion = {
  countryCode?: string | null;
  regionCode?: string | null;
};

export type GqlCatalog = {
  __typename?: string | null;
  id: string;
  title?: string | null;
  status?: string | null;
  priceList?: { id?: string | null; name?: string | null; currency?: string | null } | null;
  publication?: { id?: string | null } | null;
  marketsCount?: GqlCount | null;
  companyLocationsCount?: GqlCount | null;
};

export type GqlBusinessEntity = {
  id: string;
  displayName?: string | null;
  companyName?: string | null;
  primary?: boolean | null;
  archived?: boolean | null;
  legalEntityId?: string | null;
  address?: {
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    province?: string | null;
    zip?: string | null;
    countryCode?: string | null;
  } | null;
};

export type GqlPaymentTermsTemplate = {
  id: string;
  name?: string | null;
  translatedName?: string | null;
  description?: string | null;
  dueInDays?: number | null;
  paymentTermsType?: string | null;
};

export type GqlDispute = {
  id: string;
  legacyResourceId?: string | null;
  status?: string | null;
  type?: string | null;
  initiatedAt?: string | null;
  evidenceDueBy?: string | null;
  evidenceSentOn?: string | null;
  finalizedOn?: string | null;
  amount?: GqlMoneyV2 | null;
  reasonDetails?: { reason?: string | null; networkReasonCode?: string | null } | null;
  order?: { id?: string | null; name?: string | null } | null;
};

export type GqlShopPayReceipt = {
  token?: string | null;
  sourceIdentifier?: string | null;
  createdAt?: string | null;
  processingStatus?: { state?: string | null; message?: string | null; errorCode?: string | null } | null;
  order?: { id?: string | null; name?: string | null } | null;
  paymentRequest?: {
    presentmentCurrency?: string | null;
    total?: GqlMoneyV2 | null;
    subtotal?: GqlMoneyV2 | null;
    totalTax?: GqlMoneyV2 | null;
  } | null;
};

export type GqlWebPresence = {
  id: string;
  subfolderSuffix?: string | null;
  domain?: { id?: string | null; host?: string | null; url?: string | null } | null;
  defaultLocale?: { locale?: string | null } | null;
  rootUrls?: { locale?: string | null; url?: string | null }[] | null;
};

export type GqlSavedSearch = {
  id: string;
  name?: string | null;
  query?: string | null;
  searchTerms?: string | null;
  resourceType?: string | null;
};

export type GqlStagedTarget = {
  url?: string | null;
  resourceUrl?: string | null;
  parameters?: { name: string; value: string }[] | null;
};
