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
    throw new Error(
      `${error.message} [idempotency_key used: ${idempotencyKey}. Retry with this same idempotency_key so Shopify does not repeat the operation.]`
    );
  }
  return data;
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
};

export const shopifyGraphqlClient = {
  request: shopifyGraphql,
  toGid,
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
