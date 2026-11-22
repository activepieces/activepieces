import { bigCommerceAuth, MAX_PAGE_SIZE } from './constants';
import { bigCommerceApiService, BigCommerceRecord } from './requests';

const MAX_ADDRESS_SCAN_PAGES = 20;

function parseCommaList(value: string | undefined | null): string[] {
  if (value === undefined || value === null) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

function parsePositiveIntId({ value, field }: { value: unknown; field: string }): number {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d+$/.test(text) || Number(text) <= 0) {
    throw new Error(`${field} must be a positive whole number, got "${String(value)}".`);
  }
  return Number(text);
}

function parseNonNegativeIntId({ value, field }: { value: unknown; field: string }): number {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d+$/.test(text)) {
    throw new Error(`${field} must be a whole number of 0 or more, got "${String(value)}".`);
  }
  return Number(text);
}

function parseIdList({ value, field }: { value: string | undefined | null; field: string }): number[] {
  return parseCommaList(value).map((part) => parsePositiveIntId({ value: part, field }));
}

function parseYesNo({ value, field }: { value: string | undefined | null; field: string }): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'yes') return true;
  if (value === 'no') return false;
  throw new Error(`${field} must be "yes" or "no", got "${value}".`);
}

function parseIsoDate({ value, field }: { value: string | undefined | null; field: string }): string | undefined {
  if (value === undefined || value === null || value.trim() === '') return undefined;
  const text = value.trim();
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  if (!isoPattern.test(text) || Number.isNaN(Date.parse(text))) {
    throw new Error(`${field} must be an ISO 8601 date, for example 2026-01-31 or 2026-01-31T15:00:00Z. Got "${value}".`);
  }
  return text;
}

function validatePaging({
  limit,
  page,
}: {
  limit: number | undefined | null;
  page: number | undefined | null;
}): { limit?: number; page?: number } {
  const result: { limit?: number; page?: number } = {};
  if (limit !== undefined && limit !== null) {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new Error(`Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}, got ${limit}.`);
    }
    result.limit = limit;
  }
  if (page !== undefined && page !== null) {
    if (!Number.isInteger(page) || page < 1) {
      throw new Error(`Page must be a whole number of 1 or more, got ${page}.`);
    }
    result.page = page;
  }
  return result;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toRfc2822({ value, field }: { value: string | undefined | null; field: string }): string | undefined {
  if (value === undefined || value === null || value.trim() === '') return undefined;
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} is not a valid date: "${value}". Use ISO 8601, for example 2026-11-20T10:00:00Z.`);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${DAY_NAMES[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`;
}

async function runCreateBlogPost({
  auth,
  input,
}: {
  auth: bigCommerceAuth;
  input: BlogPostInput;
}) {
  return await bigCommerceApiService.createBlogPost({
    auth,
    payload: {
      title: input.title,
      body: input.body,
      author: input.author,
      tags: input.tags,
      is_published: input.is_published,
      meta_description: input.meta_description,
      meta_keywords: input.meta_keywords,
      published_date: toRfc2822({ value: input.published_date, field: 'Published Date' }),
      url: input.url,
    },
  });
}

function toAddressPayload({ customerId, address }: { customerId: number; address: AddressInput }) {
  return {
    customer_id: customerId,
    first_name: address.first_name,
    last_name: address.last_name,
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    state_or_province: address.state_or_province,
    postal_code: address.postal_code,
    country_code: address.country_code,
    phone: address.phone,
  };
}

async function runCreateCustomerAddress({
  auth,
  customerId,
  address,
}: {
  auth: bigCommerceAuth;
  customerId: number;
  address: AddressInput;
}) {
  return await bigCommerceApiService.createCustomerAddress({
    auth,
    payload: [toAddressPayload({ customerId, address })],
  });
}

async function runSearchCustomerAddresses({
  auth,
  customerIds,
  name,
  limit,
  page,
}: {
  auth: bigCommerceAuth;
  customerIds: number[];
  name: string | undefined | null;
  limit: number | undefined | null;
  page: number | undefined | null;
}) {
  const paging = validatePaging({ limit, page });
  return await bigCommerceApiService.fetchCustomerAddresses({
    auth,
    query: {
      'customer_id:in': customerIds.length > 0 ? customerIds.join(',') : undefined,
      'name:in': name,
      ...paging,
    },
  });
}

function sameText({ stored, input }: { stored: unknown; input: string }): boolean {
  return typeof stored === 'string' && stored.trim().toLowerCase() === input.trim().toLowerCase();
}

async function runFindOrCreateCustomerAddress({
  auth,
  customerId,
  address,
}: {
  auth: bigCommerceAuth;
  customerId: number;
  address: AddressInput;
}): Promise<{ found: boolean; data: BigCommerceRecord | BigCommerceRecord[] }> {
  let page = 1;
  let totalPages = 1;
  do {
    const response = await bigCommerceApiService.fetchCustomerAddresses({
      auth,
      query: { 'customer_id:in': customerId, limit: MAX_PAGE_SIZE, page },
    });
    const existing = response.data.find(
      (addr) =>
        sameText({ stored: addr['address1'], input: address.address1 }) &&
        sameText({ stored: addr['city'], input: address.city }) &&
        sameText({ stored: addr['postal_code'], input: address.postal_code })
    );
    if (existing) {
      return { found: true, data: existing };
    }
    totalPages = response.meta?.pagination?.total_pages ?? 1;
    page += 1;
  } while (page <= totalPages && page <= MAX_ADDRESS_SCAN_PAGES);

  if (totalPages > MAX_ADDRESS_SCAN_PAGES) {
    throw new Error(
      `Customer ${customerId} has more than ${MAX_ADDRESS_SCAN_PAGES * MAX_PAGE_SIZE} addresses, so the existing-address check could not finish. No address was created.`
    );
  }

  const created = await runCreateCustomerAddress({ auth, customerId, address });
  return { found: false, data: created.data };
}

async function enableWebhook({
  auth,
  scope,
  webhookUrl,
  store,
  cacheKey,
}: {
  auth: bigCommerceAuth;
  scope: string;
  webhookUrl: string;
  store: WebhookStore;
  cacheKey: string;
}): Promise<void> {
  const webhook = await bigCommerceApiService.createWebhook({
    auth,
    payload: { scope, destination: webhookUrl, is_active: true },
  });
  try {
    await store.put(cacheKey, webhook.id);
  } catch (err) {
    await bigCommerceApiService.deleteWebhook({ auth, webhookId: webhook.id });
    throw err;
  }
}

async function disableWebhook({
  auth,
  store,
  cacheKey,
}: {
  auth: bigCommerceAuth;
  store: WebhookStore;
  cacheKey: string;
}): Promise<void> {
  const webhookId = await store.get(cacheKey);
  if (typeof webhookId !== 'string' && typeof webhookId !== 'number') return;
  if (webhookId === '') return;
  await bigCommerceApiService.deleteWebhook({ auth, webhookId });
  await store.delete(cacheKey);
}

const DEDUPE_WINDOW_MS = 15 * 60 * 1000;
const DEDUPE_MAX_ENTRIES = 500;

function readSeenEntries(value: unknown): SeenEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: SeenEntry[] = [];
  for (const item of value) {
    if (typeof item === 'object' && item !== null && 'hash' in item && 'seenAt' in item) {
      const { hash, seenAt } = item;
      if (typeof hash === 'string' && typeof seenAt === 'number') entries.push({ hash, seenAt });
    }
  }
  return entries;
}

async function dedupeWebhookEvent({
  store,
  storeKey,
  body,
  now = Date.now(),
}: {
  store: WebhookStore;
  storeKey: string;
  body: unknown;
  now?: number;
}): Promise<unknown[]> {
  const hash =
    typeof body === 'object' && body !== null && 'hash' in body && typeof body.hash === 'string' && body.hash !== ''
      ? body.hash
      : undefined;
  if (hash === undefined) return [body];
  const fresh = readSeenEntries(await store.get(storeKey)).filter(
    (entry) => now - entry.seenAt < DEDUPE_WINDOW_MS
  );
  if (fresh.some((entry) => entry.hash === hash)) return [];
  const next = [...fresh, { hash, seenAt: now }].slice(-DEDUPE_MAX_ENTRIES);
  await store.put(storeKey, next);
  return [body];
}

export {
  dedupeWebhookEvent,
  DEDUPE_MAX_ENTRIES,
  DEDUPE_WINDOW_MS,
  parseCommaList,
  parsePositiveIntId,
  parseNonNegativeIntId,
  parseIdList,
  parseYesNo,
  parseIsoDate,
  validatePaging,
  toRfc2822,
  runCreateBlogPost,
  runCreateCustomerAddress,
  runSearchCustomerAddresses,
  runFindOrCreateCustomerAddress,
  enableWebhook,
  disableWebhook,
};

export type BlogPostInput = {
  title: string;
  body: string;
  author?: string;
  url?: string;
  published_date?: string;
  meta_description?: string;
  meta_keywords?: string;
  tags?: string[];
  is_published?: boolean;
};

export type AddressInput = {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  state_or_province: string;
  postal_code: string;
  country_code: string;
  phone?: string;
};

export type WebhookStore = {
  put(key: string, value: unknown): Promise<unknown>;
  get(key: string): Promise<unknown>;
  delete(key: string): Promise<void>;
};

export type SeenEntry = {
  hash: string;
  seenAt: number;
};
