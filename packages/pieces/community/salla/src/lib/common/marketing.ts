import { HttpMethod } from '@activepieces/pieces-common';
import { SallaAuth, SallaQuery, sallaApi } from './client';
import { STORE_TIMEZONE, sallaUtils } from './helpers';
import { TriStateInput } from './products';

async function createCoupon({ auth, input }: { auth: SallaAuth; input: CreateCouponInput }): Promise<Record<string, unknown>> {
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/coupons',
    body: buildCreateCouponBody(input),
  });
  return withCouponExtras(response.body.data);
}

function buildCreateCouponBody(input: CreateCouponInput): Record<string, unknown> {
  const code = trimmed(input.code);
  if (!code) {
    throw new Error('Give the coupon code customers type at checkout, for example SUMMER10.');
  }
  if (/\s/.test(code)) {
    throw new Error(`The coupon code "${code}" has spaces. Use letters and digits only, for example SUMMER10.`);
  }
  const type = requireCouponType(input.type);
  const amount = sallaUtils.optionalNumber({ value: input.amount, label: 'Discount amount' });
  if (amount === undefined || amount <= 0) {
    throw new Error('Give the discount amount, a number greater than 0 (for example 10 for 10% or 10 SAR).');
  }
  if (type === 'percentage' && amount > 100) {
    throw new Error(`A percentage coupon cannot take more than 100%; you gave ${amount}.`);
  }
  const expiryDate = toCouponDate({ value: input.expiryDate, label: 'Expiry date' });
  if (!expiryDate) {
    throw new Error('Give the coupon expiry date, for example 2026-12-31. It must be at least one day after today.');
  }
  checkExpiryDate({ value: expiryDate, now: new Date() });
  const startDate = toCouponDate({ value: input.startDate, label: 'Start date' });
  if (startDate && datePart(startDate) >= datePart(expiryDate)) {
    throw new Error(`The start date (${startDate}) must be before the expiry date (${expiryDate}).`);
  }
  const minimumAmount = nonNegative({ value: input.minimumAmount, label: 'Minimum purchase amount' });
  const maximumAmount = nonNegative({ value: input.maximumAmount, label: 'Maximum discount amount' });
  if (type === 'percentage' && maximumAmount === undefined) {
    throw new Error('Salla needs a maximum discount amount for percentage coupons. Fill Maximum Discount, for example 50.');
  }
  const appliedIn = optionalAppliedIn(input.appliedIn);
  const status = optionalCouponStatus(input.status);
  const paymentMethods = sallaUtils
    .toStringList(input.paymentMethods)
    .map((method) => method.toLowerCase());
  return sallaUtils.compact({
    code,
    type,
    amount,
    free_shipping: sallaUtils.triState(input.freeShipping) ?? false,
    expiry_date: endOfDayWhenDateOnly(expiryDate),
    exclude_sale_products: sallaUtils.triState(input.excludeSaleProducts) ?? false,
    start_date: startDate,
    status,
    applied_in: appliedIn,
    minimum_amount: minimumAmount,
    maximum_amount: maximumAmount,
    usage_limit: wholeNumber({ value: input.usageLimit, label: 'Usage limit' }),
    usage_limit_per_user: wholeNumber({ value: input.usageLimitPerUser, label: 'Usage limit per customer' }),
    is_apply_with_offer: sallaUtils.triState(input.applyWithOffer),
    show_maximum_amount: sallaUtils.triState(input.showMaximumAmount),
    products_include: idList({ value: input.includeProductIds, label: 'Included product ID' }),
    products_exclude: idList({ value: input.excludeProductIds, label: 'Excluded product ID' }),
    list_include_categories: idList({ value: input.includeCategoryIds, label: 'Included category ID' }),
    list_exclude_categories: idList({ value: input.excludeCategoryIds, label: 'Excluded category ID' }),
    list_exclude_brands: idList({ value: input.excludeBrandIds, label: 'Excluded brand ID' }),
    list_include_groups: idList({ value: input.includeCustomerGroupIds, label: 'Included customer group ID' }),
    list_exclude_groups: idList({ value: input.excludeCustomerGroupIds, label: 'Excluded customer group ID' }),
    list_exclude_shipping: idList({ value: input.excludeShippingCompanyIds, label: 'Excluded shipping company ID' }),
    payment_methods: paymentMethods.length > 0 ? paymentMethods : undefined,
    beneficiary_domain: trimmed(input.beneficiaryDomain),
  });
}

function checkExpiryDate({ value, now }: { value: string; now: Date | number }): void {
  const today = storeToday(now);
  const tomorrow = addDays({ date: today, days: 1 });
  if (datePart(value) < tomorrow) {
    throw new Error(
      `The coupon expiry date must be at least one day after today in store time (Asia/Riyadh). Today is ${today}, so use ${tomorrow} or later; you gave ${value}.`,
    );
  }
}

function toCouponDate({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0)) {
    return undefined;
  }
  const text = typeof value === 'string' ? sallaUtils.normalizeDigits(value).trim() : String(value);
  const invalid = new Error(`${label} "${text}" is not a valid date. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS, for example 2026-12-31.`);
  const local = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/.exec(text);
  if (local) {
    const [, year, month, day, hour, minute, second] = local;
    const check = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (check.getUTCFullYear() !== Number(year) || check.getUTCMonth() !== Number(month) - 1 || check.getUTCDate() !== Number(day)) {
      throw invalid;
    }
    if (hour === undefined || minute === undefined) {
      return `${year}-${month}-${day}`;
    }
    const seconds = second ?? '00';
    if (Number(hour) > 23 || Number(minute) > 59 || Number(seconds) > 59) {
      throw invalid;
    }
    return `${year}-${month}-${day} ${hour}:${minute}:${seconds}`;
  }
  const parsed = new Date(text);
  if (typeof value !== 'string' || Number.isNaN(parsed.getTime())) {
    throw invalid;
  }
  return storeDateTime(parsed);
}

function storeDateTime(instant: Date): string {
  const parts = storeParts(instant);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function storeToday(now: Date | number): string {
  const parts = storeParts(new Date(now));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function storeParts(instant: Date): Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: STORE_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const result = { year: '', month: '', day: '', hour: '00', minute: '00', second: '00' };
  for (const part of formatter.formatToParts(instant)) {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day' || part.type === 'hour' || part.type === 'minute' || part.type === 'second') {
      result[part.type] = part.value;
    }
  }
  return result;
}

function addDays({ date, days }: { date: string; days: number }): string {
  const [year, month, day] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function endOfDayWhenDateOnly(value: string): string {
  return value.length === DATE_ONLY_LENGTH ? `${value} ${END_OF_DAY}` : value;
}

function datePart(value: string): string {
  return value.slice(0, 10);
}

function requireCouponType(value: unknown): CouponType {
  const text = (sallaUtils.dropdownText({ value, label: 'Coupon type' }) ?? '').toLowerCase();
  const match = COUPON_TYPE_ALIASES[text];
  if (!match) {
    throw new Error(`"${String(value ?? '')}" is not a coupon type. Use percentage or fixed.`);
  }
  return match;
}

function optionalAppliedIn(value: unknown): CouponAppliedIn | undefined {
  const text = (sallaUtils.dropdownText({ value, label: 'Applied In' }) ?? '').toLowerCase();
  if (text.length === 0) {
    return undefined;
  }
  const match = COUPON_APPLIED_IN.find((entry) => entry === text);
  if (!match) {
    throw new Error(`"${String(value)}" is not a valid channel. Use all, web or app.`);
  }
  return match;
}

function optionalCouponStatus(value: unknown): CouponStatus | undefined {
  const text = (sallaUtils.dropdownText({ value, label: 'Coupon status' }) ?? '').toLowerCase();
  if (text.length === 0) {
    return undefined;
  }
  const match = COUPON_STATUSES.find((entry) => entry === text);
  if (!match) {
    throw new Error(`"${String(value)}" is not a coupon status. Use active or inactive.`);
  }
  return match;
}

function idList({ value, label }: { value: unknown; label: string }): string[] | undefined {
  const ids = sallaUtils.toStringList(value).map((id) => sallaUtils.requireId({ value: id, label }));
  return ids.length > 0 ? [...new Set(ids)] : undefined;
}

async function listCoupons({ auth, filters }: { auth: SallaAuth; filters: CouponFilters }): Promise<CouponListResult> {
  const { items, truncated } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/coupons',
    query: buildCouponListQuery(filters),
    maxItems: filters.maxResults,
    perPage: COUPONS_PER_PAGE,
  });
  const coupons = items.filter(sallaApi.isRecord).map(withCouponExtras);
  return { coupons, count: coupons.length, truncated };
}

function buildCouponListQuery(filters: CouponFilters): SallaQuery {
  const query: SallaQuery = { keyword: trimmed(filters.keyword) };
  const creation = dateRange({ from: filters.createdFrom, to: filters.createdTo });
  if (creation) {
    query['creation_date'] = [creation];
  }
  const expiration = dateRange({ from: filters.expiresFrom, to: filters.expiresTo });
  if (expiration) {
    query['expiration_date'] = [expiration];
  }
  return query;
}

function dateRange({ from, to }: { from?: string; to?: string }): string | undefined {
  const start = sallaUtils.toStoreDate(from);
  const end = sallaUtils.toStoreDate(to);
  if (start === undefined && end === undefined) {
    return undefined;
  }
  const rangeStart = start ?? OPEN_RANGE_START;
  const rangeEnd = end ?? OPEN_RANGE_END;
  if (rangeStart > rangeEnd) {
    throw new Error(`The date range starts (${rangeStart}) after it ends (${rangeEnd}).`);
  }
  return `${rangeStart},${rangeEnd}`;
}

async function getCoupon({
  auth,
  couponId,
  includeStats,
}: {
  auth: SallaAuth;
  couponId: unknown;
  includeStats?: boolean;
}): Promise<Record<string, unknown>> {
  const id = sallaUtils.requireId({ value: couponId, label: 'Coupon ID' });
  const [couponResponse, statsResponse] = await Promise.all([
    sallaApi.request<unknown>({ auth, method: HttpMethod.GET, path: `/coupons/${id}` }),
    includeStats ? sallaApi.request<unknown>({ auth, method: HttpMethod.GET, path: `/coupons/statistics/${id}` }) : Promise.resolve(undefined),
  ]);
  const coupon = sallaApi.isRecord(couponResponse.body.data) ? couponResponse.body.data : {};
  const statistics = statsResponse && sallaApi.isRecord(statsResponse.body.data) ? statsResponse.body.data : undefined;
  return withCouponExtras(statistics ? { ...coupon, statistics } : coupon);
}

async function listAbandonedCarts({ auth, filters }: { auth: SallaAuth; filters: AbandonedCartFilters }): Promise<AbandonedCartListResult> {
  const { items, truncated } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/carts/abandoned',
    query: buildAbandonedCartListQuery(filters),
    maxItems: filters.maxResults,
    perPage: CARTS_PER_PAGE,
    keepLargeIds: true,
  });
  const carts = items.filter(sallaApi.isRecord).map(withCartExtras);
  return { carts, count: carts.length, truncated };
}

function buildAbandonedCartListQuery(filters: AbandonedCartFilters): SallaQuery {
  const keyword = trimmed(filters.keyword);
  const offset = sallaUtils.optionalNumber({ value: filters.olderThanMinutes, label: 'Offset (minutes)' });
  if (offset !== undefined && (offset < 0 || !Number.isInteger(offset))) {
    throw new Error(`Offset (minutes) must be a whole number of minutes, 0 or more; you gave ${String(filters.olderThanMinutes)}.`);
  }
  return {
    keyword: keyword ? sallaUtils.normalizeDigits(keyword) : undefined,
    offset,
  };
}

async function getAbandonedCart({ auth, cartId }: { auth: SallaAuth; cartId: unknown }): Promise<Record<string, unknown>> {
  const id = sallaUtils.requireId({ value: cartId, label: 'Cart ID' });
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/carts/abandoned/${id}`,
    keepLargeIds: true,
  });
  return withCartExtras(response.body.data);
}

function withCouponExtras(coupon: unknown): Record<string, unknown> {
  if (!sallaApi.isRecord(coupon)) {
    return {};
  }
  const statistics = sallaApi.isRecord(coupon['statistics']) ? coupon['statistics'] : undefined;
  const groupCoupons = Array.isArray(coupon['group_coupons']) ? coupon['group_coupons'] : [];
  const groupCodes = groupCoupons
    .map((entry) => (sallaApi.isRecord(entry) ? textOrUndefined(entry['code']) : textOrUndefined(entry)))
    .filter((code): code is string => code !== undefined);
  const type = typeof coupon['type'] === 'string' ? COUPON_TYPE_ALIASES[coupon['type'].trim().toLowerCase()] : undefined;
  const flat: Record<string, unknown> = {
    type_normalized: type ?? null,
    amount_value: sallaUtils.amountOf(coupon['amount']) ?? null,
    minimum_amount_value: sallaUtils.amountOf(coupon['minimum_amount']) ?? null,
    maximum_amount_value: sallaUtils.amountOf(coupon['maximum_amount']) ?? null,
    currency: currencyOf(coupon['amount']) ?? currencyOf(coupon['maximum_amount']) ?? textOrUndefined(coupon['currency']) ?? null,
    start_date_iso: sallaUtils.toIsoDate(coupon['start_date']) ?? null,
    expiry_date_iso: sallaUtils.toIsoDate(coupon['expiry_date']) ?? null,
    created_at_iso: sallaUtils.toIsoDate(coupon['created_at']) ?? null,
    updated_at_iso: sallaUtils.toIsoDate(coupon['updated_at']) ?? null,
    usage_count: statistics ? sallaUtils.amountOf(statistics['num_of_usage']) ?? null : null,
    customer_count: statistics ? sallaUtils.amountOf(statistics['num_of_customers']) ?? null : null,
    sales_amount: statistics ? sallaUtils.amountOf(statistics['coupon_sales']) ?? null : null,
    group_codes: groupCodes.length > 0 ? groupCodes.join(', ') : null,
  };
  return { ...flat, ...coupon };
}

function withCartExtras(cart: unknown): Record<string, unknown> {
  if (!sallaApi.isRecord(cart)) {
    return {};
  }
  const customer = sallaApi.isRecord(cart['customer']) ? cart['customer'] : {};
  const coupon = sallaApi.isRecord(cart['coupon']) ? cart['coupon'] : {};
  const urls = sallaApi.isRecord(cart['urls']) ? cart['urls'] : {};
  const items = Array.isArray(cart['items']) ? cart['items'].filter(sallaApi.isRecord) : [];
  const productIds = items
    .map((item) => idText(item['product_id']))
    .filter((id): id is string => id !== undefined)
    .map(Number);
  const quantities = items.map((item) => sallaUtils.amountOf(item['quantity']) ?? 0);
  const flat: Record<string, unknown> = {
    total_amount: sallaUtils.amountOf(cart['total']) ?? null,
    subtotal_amount: sallaUtils.amountOf(cart['subtotal']) ?? null,
    total_discount_amount: sallaUtils.amountOf(cart['total_discount']) ?? null,
    currency: currencyOf(cart['total']) ?? currencyOf(cart['subtotal']) ?? textOrUndefined(cart['currency']) ?? null,
    checkout_url: textOrUndefined(cart['checkout_url']) ?? textOrUndefined(urls['checkout']) ?? null,
    customer_id: customer['id'] ?? null,
    customer_name: textOrUndefined(customer['name']) ?? textOrUndefined(customer['full_name']) ?? null,
    customer_mobile: textOrUndefined(idText(customer['mobile'])) ?? null,
    customer_email: textOrUndefined(customer['email']) ?? null,
    customer_city: textOrUndefined(customer['city']) ?? null,
    customer_country: textOrUndefined(customer['country']) ?? null,
    coupon_id: coupon['id'] ?? null,
    coupon_code: textOrUndefined(coupon['code']) ?? null,
    item_count: items.length,
    item_quantity: quantities.reduce((sum, quantity) => sum + quantity, 0),
    product_ids: productIds,
    created_at_iso: sallaUtils.toIsoDate(cart['created_at']) ?? null,
    updated_at_iso: sallaUtils.toIsoDate(cart['updated_at']) ?? null,
  };
  return { ...flat, ...cart };
}

function withReviewExtras(review: unknown): Record<string, unknown> {
  if (!sallaApi.isRecord(review)) {
    return {};
  }
  const customer = sallaApi.isRecord(review['customer']) ? review['customer'] : {};
  const product = sallaApi.isRecord(review['product']) ? review['product'] : {};
  const order = sallaApi.isRecord(review['order']) ? review['order'] : {};
  const dates = Array.isArray(review['date']) ? review['date'] : [review['date']];
  const firstDate = dates.map((entry) => textOrUndefined(sallaApi.isRecord(entry) ? entry['date'] : entry)).find((entry) => entry !== undefined);
  const flat: Record<string, unknown> = {
    review_type: textOrUndefined(review['type']) ?? null,
    rating_number: sallaUtils.amountOf(review['rating']) ?? null,
    content: textOrUndefined(review['content']) ?? null,
    customer_id: idNumber(customer['id']),
    customer_name: textOrUndefined(customer['name']) ?? null,
    customer_mobile: textOrUndefined(idText(customer['mobile'])) ?? null,
    product_id: idNumber(product['id']),
    product_name: textOrUndefined(product['name']) ?? textOrUndefined(review['name']) ?? null,
    order_id: idNumber(order['id']),
    order_reference_id: idNumber(order['reference_id']),
    review_date: firstDate ?? null,
    created_at_iso: sallaUtils.toIsoDate(review['created_at']) ?? sallaUtils.toIsoDate(firstDate) ?? null,
  };
  return { ...flat, ...review };
}

function idNumber(value: unknown): number | null {
  const text = idText(value);
  return text !== undefined && /^\d+$/.test(text) ? Number(text) : null;
}

function currencyOf(value: unknown): string | undefined {
  return sallaApi.isRecord(value) ? textOrUndefined(value['currency']) : undefined;
}

function nonNegative({ value, label }: { value: unknown; label: string }): number | undefined {
  const parsed = sallaUtils.optionalNumber({ value, label });
  if (parsed !== undefined && parsed < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
  return parsed;
}

function wholeNumber({ value, label }: { value: unknown; label: string }): number | undefined {
  const parsed = nonNegative({ value, label });
  if (parsed !== undefined && !Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number, but got "${String(value)}".`);
  }
  return parsed;
}

function idText(value: unknown): string | undefined {
  return typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0) ? String(value).trim() : undefined;
}

function textOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const result = value.trim();
  return result.length > 0 ? result : undefined;
}

function trimmed(value: string | undefined | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const result = value.trim();
  return result.length > 0 ? result : undefined;
}

const COUPONS_PER_PAGE = 60;
const DATE_ONLY_LENGTH = 10;
const END_OF_DAY = '23:59:59';
const CARTS_PER_PAGE = 60;
const OPEN_RANGE_START = '2000-01-01';
const OPEN_RANGE_END = '2099-12-31';

const COUPON_TYPES: CouponType[] = ['percentage', 'fixed'];
const COUPON_STATUSES: CouponStatus[] = ['active', 'inactive'];
const COUPON_APPLIED_IN: CouponAppliedIn[] = ['all', 'web', 'app'];
const COUPON_PAYMENT_METHODS = [
  'all',
  'apple_pay',
  'bank',
  'cod',
  'credit_card',
  'knet',
  'mada',
  'paypal',
  'spotii_pay',
  'stc_pay',
  'tabby_installment',
  'tamara_installment',
];

const COUPON_TYPE_ALIASES: Record<string, CouponType | undefined> = {
  percentage: 'percentage',
  percent: 'percentage',
  p: 'percentage',
  fixed: 'fixed',
  f: 'fixed',
};

export const sallaMarketing = {
  createCoupon,
  buildCreateCouponBody,
  checkExpiryDate,
  toCouponDate,
  listCoupons,
  buildCouponListQuery,
  getCoupon,
  listAbandonedCarts,
  buildAbandonedCartListQuery,
  getAbandonedCart,
  withCouponExtras,
  withCartExtras,
  withReviewExtras,
};

export { COUPON_TYPES, COUPON_STATUSES, COUPON_APPLIED_IN, COUPON_PAYMENT_METHODS };

type CouponType = 'percentage' | 'fixed';

type CouponStatus = 'active' | 'inactive';

type CouponAppliedIn = 'all' | 'web' | 'app';

type IdListInput = Array<string | number> | string;

type CreateCouponInput = {
  code: string;
  type: CouponType | string;
  amount: string | number;
  expiryDate: string;
  freeShipping?: TriStateInput;
  excludeSaleProducts?: TriStateInput;
  startDate?: string;
  status?: CouponStatus | string;
  appliedIn?: CouponAppliedIn | string;
  minimumAmount?: string | number;
  maximumAmount?: string | number;
  usageLimit?: string | number;
  usageLimitPerUser?: string | number;
  applyWithOffer?: TriStateInput;
  showMaximumAmount?: TriStateInput;
  includeProductIds?: IdListInput;
  excludeProductIds?: IdListInput;
  includeCategoryIds?: IdListInput;
  excludeCategoryIds?: IdListInput;
  excludeBrandIds?: IdListInput;
  includeCustomerGroupIds?: IdListInput;
  excludeCustomerGroupIds?: IdListInput;
  excludeShippingCompanyIds?: IdListInput;
  paymentMethods?: string[] | string;
  beneficiaryDomain?: string;
};

type CouponFilters = {
  maxResults: number;
  keyword?: string;
  createdFrom?: string;
  createdTo?: string;
  expiresFrom?: string;
  expiresTo?: string;
};

type CouponListResult = {
  coupons: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

type AbandonedCartFilters = {
  maxResults: number;
  keyword?: string;
  olderThanMinutes?: string | number;
};

type AbandonedCartListResult = {
  carts: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

export type {
  CouponType,
  CouponStatus,
  CouponAppliedIn,
  IdListInput,
  CreateCouponInput,
  CouponFilters,
  CouponListResult,
  AbandonedCartFilters,
  AbandonedCartListResult,
};
