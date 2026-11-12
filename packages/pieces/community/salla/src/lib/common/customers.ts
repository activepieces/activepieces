import { HttpMethod } from '@activepieces/pieces-common';
import { SallaAuth, SallaQuery, sallaApi } from './client';
import { sallaUtils } from './helpers';

async function listCustomers({ auth, filters }: { auth: SallaAuth; filters: CustomerFilters }): Promise<CustomerListResult> {
  const { items, truncated } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/customers',
    query: buildCustomerListQuery(filters),
    maxItems: filters.maxResults,
    perPage: CUSTOMERS_PER_PAGE,
  });
  const customers = items.filter(sallaApi.isRecord).map(withCustomerExtras);
  return { customers, count: customers.length, truncated };
}

function buildCustomerListQuery(filters: CustomerFilters): SallaQuery {
  return {
    keyword: trimmed(filters.keyword),
    date_from: sallaUtils.toStoreDate(filters.dateFrom),
    date_to: sallaUtils.toStoreDate(filters.dateTo),
  };
}

async function getCustomer({
  auth,
  customerId,
  includeStats,
}: {
  auth: SallaAuth;
  customerId: unknown;
  includeStats?: boolean;
}): Promise<Record<string, unknown>> {
  const id = sallaUtils.requireId({ value: customerId, label: 'Customer ID' });
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/customers/${id}`,
    query: includeStats ? { fields: CUSTOMER_STATS_FIELDS } : undefined,
  });
  return withCustomerExtras(response.body.data);
}

async function createCustomer({ auth, input }: { auth: SallaAuth; input: CreateCustomerInput }): Promise<Record<string, unknown>> {
  const body = buildCreateCustomerBody(input);
  await refuseTakenMobileOrEmail({ auth, body });
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/customers',
    body,
  });
  return withCustomerExtras(response.body.data);
}

async function refuseTakenMobileOrEmail({ auth, body }: { auth: SallaAuth; body: Record<string, unknown> }): Promise<void> {
  const mobile = String(body['mobile']);
  const dialCode = String(body['mobile_code_country']);
  const sameMobile = await findCustomer({
    auth,
    keyword: mobile,
    matches: (customer) => nationalDigits(customer['mobile']) === mobile && dialCodeOf(customer['mobile_code']) === dialCode,
  });
  if (sameMobile) {
    throw new Error(
      `Customer ${String(sameMobile['id'])} already has the mobile ${dialCode}${mobile}. Salla would overwrite that customer's name and email instead of adding a new customer, so nothing was sent. Use Update Customer to change that customer.`,
    );
  }
  const email = typeof body['email'] === 'string' ? body['email'].toLowerCase() : undefined;
  if (!email) {
    return;
  }
  const sameEmail = await findCustomer({
    auth,
    keyword: email,
    matches: (customer) => typeof customer['email'] === 'string' && customer['email'].trim().toLowerCase() === email,
  });
  if (sameEmail) {
    throw new Error(
      `Customer ${String(sameEmail['id'])} already has the email ${email}. Salla would add a second customer with the same email, so nothing was sent. Use Update Customer to change that customer, or use another email.`,
    );
  }
}

async function findCustomer({
  auth,
  keyword,
  matches,
}: {
  auth: SallaAuth;
  keyword: string;
  matches: (customer: Record<string, unknown>) => boolean;
}): Promise<Record<string, unknown> | undefined> {
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/customers',
    query: { keyword, per_page: CUSTOMERS_PER_PAGE },
  });
  const customers = Array.isArray(response.body.data) ? response.body.data.filter(sallaApi.isRecord) : [];
  return customers.find(matches);
}

function nationalDigits(value: unknown): string | undefined {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? sallaUtils.normalizeDigits(value).replace(/\D/g, '') : '';
  const digits = text.replace(/^0+/, '');
  return digits.length > 0 ? digits : undefined;
}

function dialCodeOf(value: unknown): string | undefined {
  const digits = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.replace(/\D/g, '') : '';
  return digits.length > 0 ? `+${digits}` : undefined;
}

function buildCreateCustomerBody(input: CreateCustomerInput): Record<string, unknown> {
  const firstName = trimmed(input.firstName);
  const lastName = trimmed(input.lastName);
  if (!firstName || !lastName) {
    throw new Error('Give the customer\'s first name and last name.');
  }
  const mobile = resolveMobile({ mobile: input.mobile, mobileCountryCode: input.mobileCountryCode, countryCode: input.countryCode });
  if (!mobile) {
    throw new Error('Give the customer\'s mobile number with the country code, for example +966501234567.');
  }
  if (!mobile.country_code) {
    throw new Error(
      `Salla needs the customer's country as a two-letter code, for example SA. It could not be worked out from ${mobile.mobile_code_country}; fill Country Code.`,
    );
  }
  const groups = groupIdList(input.groupIds);
  return sallaUtils.compact({
    first_name: firstName,
    last_name: lastName,
    mobile: mobile.mobile,
    mobile_code_country: mobile.mobile_code_country,
    country_code: mobile.country_code,
    email: optionalEmail(input.email),
    gender: optionalGender(input.gender),
    birthday: sallaUtils.toStoreDate(input.birthday),
    groups: groups.length > 0 ? groups : undefined,
  });
}

async function updateCustomer({
  auth,
  customerId,
  input,
}: {
  auth: SallaAuth;
  customerId: unknown;
  input: UpdateCustomerInput;
}): Promise<Record<string, unknown>> {
  const id = sallaUtils.requireId({ value: customerId, label: 'Customer ID' });
  const body = buildUpdateCustomerBody(input);
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `/customers/${id}`,
    body,
  });
  return withCustomerExtras(response.body.data);
}

function buildUpdateCustomerBody(input: UpdateCustomerInput): Record<string, unknown> {
  const hasMobile = isFilled(input.mobile);
  if (!hasMobile && isFilled(input.mobileCountryCode)) {
    throw new Error('Mobile Country Code changes only together with the mobile number. Fill the mobile number too.');
  }
  const mobile = hasMobile
    ? resolveMobile({ mobile: input.mobile, mobileCountryCode: input.mobileCountryCode, countryCode: input.countryCode })
    : undefined;
  const groups = groupIdList(input.groupIds);
  const body = sallaUtils.compact({
    first_name: trimmed(input.firstName),
    last_name: trimmed(input.lastName),
    mobile: mobile?.mobile,
    mobile_code_country: mobile?.mobile_code_country,
    country_code: mobile?.country_code ?? optionalCountryCode(input.countryCode),
    email: optionalEmail(input.email),
    gender: optionalGender(input.gender),
    birthday: sallaUtils.toStoreDate(input.birthday),
    groups: groups.length > 0 ? groups : undefined,
  });
  if (Object.keys(body).length === 0) {
    throw new Error('Nothing to update. Fill at least one field to change on the customer.');
  }
  return body;
}

function resolveMobile({
  mobile,
  mobileCountryCode,
  countryCode,
}: {
  mobile: unknown;
  mobileCountryCode?: unknown;
  countryCode?: unknown;
}): ResolvedMobile | undefined {
  const raw = typeof mobile === 'number' ? String(mobile) : typeof mobile === 'string' ? sallaUtils.normalizeDigits(mobile).trim() : '';
  const cleaned = raw.replace(/[\s\-().]/g, '');
  if (cleaned.length === 0) {
    return undefined;
  }
  const isInternational = cleaned.startsWith('+') || cleaned.startsWith('00');
  const digits = cleaned.replace(/^\+|^00/, '');
  if (!/^\d+$/.test(digits)) {
    throw new Error(`"${raw}" is not a mobile number. Use digits only, for example +966501234567 or 501234567.`);
  }
  const givenCode = optionalDialCode(mobileCountryCode);
  const iso = optionalCountryCode(countryCode);
  let dialCode: string;
  let national: string;
  if (isInternational) {
    const code = givenCode ?? matchDialCode(digits);
    if (!code) {
      throw new Error(
        `Could not tell the country code of "${raw}". Fill Mobile Country Code (for example +966) and give the number without it.`,
      );
    }
    if (!digits.startsWith(code)) {
      throw new Error(`The mobile number "${raw}" does not start with the country code +${code}. Check both values.`);
    }
    dialCode = code;
    national = digits.slice(code.length);
  } else {
    const code = givenCode ?? (iso ? DIAL_CODE_BY_COUNTRY.get(iso) : undefined);
    if (!code) {
      throw new Error(
        `"${raw}" has no country code. Give the mobile as +966501234567, or fill Mobile Country Code (for example +966).`,
      );
    }
    dialCode = code;
    national = digits;
  }
  national = national.replace(/^0+/, '');
  if (national.length < MIN_NATIONAL_DIGITS || national.length > MAX_NATIONAL_DIGITS) {
    throw new Error(`"${raw}" is not a valid mobile number for +${dialCode}. Check the digits.`);
  }
  return {
    mobile: national,
    mobile_code_country: `+${dialCode}`,
    country_code: iso ?? COUNTRY_BY_DIAL_CODE.get(dialCode),
  };
}

function matchDialCode(digits: string): string | undefined {
  for (const length of [3, 2, 1]) {
    const prefix = digits.slice(0, length);
    if (KNOWN_DIAL_CODES.has(prefix)) {
      return prefix;
    }
  }
  return undefined;
}

function optionalDialCode(value: unknown): string | undefined {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? sallaUtils.normalizeDigits(value).trim() : '';
  if (text.length === 0) {
    return undefined;
  }
  const digits = text.replace(/^\+|^00/, '');
  if (!/^\d{1,4}$/.test(digits)) {
    throw new Error(`"${text}" is not a country calling code. Use the digits after the plus sign, for example +966.`);
  }
  return digits;
}

function optionalCountryCode(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    return undefined;
  }
  if (!/^[a-zA-Z]{2}$/.test(text)) {
    throw new Error(`"${text}" is not a country code. Use the two-letter code, for example SA.`);
  }
  return text.toUpperCase();
}

function optionalEmail(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    return undefined;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    throw new Error(`"${text}" is not an email address.`);
  }
  return text;
}

function optionalGender(value: unknown): CustomerGender | undefined {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (text.length === 0) {
    return undefined;
  }
  const match = CUSTOMER_GENDERS.find((gender) => gender === text);
  if (!match) {
    throw new Error(`"${String(value)}" is not a gender Salla accepts. Use male or female.`);
  }
  return match;
}

function groupIdList(value: unknown): number[] {
  return sallaUtils.toStringList(value).map((id) => Number(sallaUtils.requireId({ value: id, label: 'Customer group ID' })));
}

async function addCustomersToGroup({
  auth,
  groupId,
  customerIds,
}: {
  auth: SallaAuth;
  groupId: unknown;
  customerIds: unknown;
}): Promise<AddCustomersToGroupResult> {
  const body = buildAddCustomersToGroupBody({ groupId, customerIds });
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/customers/groups/add_customers',
    body,
  });
  return {
    group_id: body.group_id,
    customer_ids: body.customers,
    count: body.customers.length,
    message: messageOf(response.body.data) ?? null,
  };
}

function buildAddCustomersToGroupBody({ groupId, customerIds }: { groupId: unknown; customerIds: unknown }): { group_id: number; customers: number[] } {
  const group = Number(sallaUtils.requireId({ value: groupId, label: 'Customer group ID' }));
  const customers = [...new Set(sallaUtils.toStringList(customerIds).map((id) => Number(sallaUtils.requireId({ value: id, label: 'Customer ID' }))))];
  if (customers.length === 0) {
    throw new Error('Pick at least one customer to add to the group.');
  }
  return { group_id: group, customers };
}

async function listCustomerGroups({ auth }: { auth: SallaAuth }): Promise<CustomerGroupListResult> {
  const { items, truncated } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/customers/groups',
    maxItems: MAX_CUSTOMER_GROUPS,
    perPage: 60,
  });
  const groups = items.filter(sallaApi.isRecord).map((group) => sallaUtils.withKeys({ record: group, keys: ['id', 'name'] }));
  return { groups, count: groups.length, truncated };
}

function withCustomerExtras(customer: unknown): Record<string, unknown> {
  if (!sallaApi.isRecord(customer)) {
    return {};
  }
  const urls = sallaApi.isRecord(customer['urls']) ? customer['urls'] : {};
  const groups = Array.isArray(customer['groups']) ? customer['groups'] : [];
  const groupIds = groups
    .map((group) => idText(sallaApi.isRecord(group) ? group['id'] : group))
    .filter((id): id is string => id !== undefined)
    .map(Number)
    .filter((id) => Number.isFinite(id));
  const groupNames = groups
    .map((group) => (sallaApi.isRecord(group) ? textOrUndefined(group['name']) : undefined))
    .filter((name): name is string => name !== undefined);
  const firstName = textOrUndefined(customer['first_name']);
  const lastName = textOrUndefined(customer['last_name']);
  const flat: Record<string, unknown> = {
    full_name: textOrUndefined(customer['full_name']) ?? textOrUndefined([firstName, lastName].filter(Boolean).join(' ')) ?? textOrUndefined(customer['name']) ?? null,
    mobile_full: fullMobile({ code: customer['mobile_code'], number: customer['mobile'] }) ?? null,
    email: textOrUndefined(customer['email']) ?? null,
    city: textOrUndefined(customer['city']) ?? null,
    country: textOrUndefined(customer['country']) ?? null,
    country_code: textOrUndefined(customer['country_code']) ?? null,
    gender: textOrUndefined(customer['gender']) ?? null,
    group_ids: groupIds,
    group_names: groupNames.length > 0 ? groupNames.join(', ') : null,
    birthday_date: dateOnly(customer['birthday']) ?? null,
    customer_url: textOrUndefined(urls['customer']) ?? null,
    admin_url: textOrUndefined(urls['admin']) ?? null,
    created_at_iso: sallaUtils.toIsoDate(customer['created_at']) ?? null,
    updated_at_iso: sallaUtils.toIsoDate(customer['updated_at']) ?? null,
  };
  const stats = sallaApi.isRecord(customer['stats']) ? customer['stats'] : undefined;
  if (stats) {
    flat['orders_count'] = sallaUtils.amountOf(stats['orders_count']) ?? null;
    flat['orders_amount'] = sallaUtils.amountOf(stats['orders_amount']) ?? null;
  }
  if ('latest_purchase' in customer) {
    flat['latest_purchase_iso'] = sallaUtils.toIsoDate(customer['latest_purchase']) ?? null;
  }
  return { ...flat, ...customer };
}

function fullMobile({ code, number }: { code: unknown; number: unknown }): string | undefined {
  const numberText = idText(number);
  if (!numberText) {
    return undefined;
  }
  const cleanNumber = sallaUtils.normalizeDigits(numberText).replace(/[\s\-()]/g, '');
  if (cleanNumber.startsWith('+')) {
    return cleanNumber;
  }
  const codeDigits = sallaUtils.normalizeDigits(idText(code) ?? '').replace(/\D/g, '');
  return codeDigits.length > 0 ? `+${codeDigits}${cleanNumber.replace(/^0+/, '')}` : cleanNumber;
}

function dateOnly(value: unknown): string | undefined {
  const text = sallaApi.isRecord(value) ? value['date'] : value;
  if (typeof text !== 'string') {
    return undefined;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(text.trim());
  return match ? match[1] : undefined;
}

function messageOf(data: unknown): string | undefined {
  if (typeof data === 'string') {
    return textOrUndefined(data);
  }
  if (Array.isArray(data)) {
    const messages = data.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
    return messages.length > 0 ? messages.join(' ') : undefined;
  }
  return sallaApi.isRecord(data) && typeof data['message'] === 'string' ? data['message'] : undefined;
}

function isFilled(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  return typeof value === 'string' && value.trim().length > 0;
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

const CUSTOMERS_PER_PAGE = 60;
const MAX_CUSTOMER_GROUPS = 500;
const MIN_NATIONAL_DIGITS = 6;
const MAX_NATIONAL_DIGITS = 13;

const CUSTOMER_GENDERS: CustomerGender[] = ['male', 'female'];

const CUSTOMER_STATS_FIELDS = [
  'orders_count',
  'orders_amount',
  'orders_average',
  'orders_complete_ratio',
  'orders_cancel_ratio',
  'orders_cancel',
  'latest_purchase',
  'abandoned_carts_items',
  'wallet_balance',
  'total_points',
  'is_blocked',
  'block_reason',
];

const DIAL_CODES: Array<{ code: string; country?: string }> = [
  { code: '966', country: 'SA' },
  { code: '971', country: 'AE' },
  { code: '965', country: 'KW' },
  { code: '974', country: 'QA' },
  { code: '973', country: 'BH' },
  { code: '968', country: 'OM' },
  { code: '967', country: 'YE' },
  { code: '962', country: 'JO' },
  { code: '964', country: 'IQ' },
  { code: '963', country: 'SY' },
  { code: '961', country: 'LB' },
  { code: '970', country: 'PS' },
  { code: '20', country: 'EG' },
  { code: '212', country: 'MA' },
  { code: '213', country: 'DZ' },
  { code: '216', country: 'TN' },
  { code: '218', country: 'LY' },
  { code: '249', country: 'SD' },
  { code: '222', country: 'MR' },
  { code: '252', country: 'SO' },
  { code: '253', country: 'DJ' },
  { code: '269', country: 'KM' },
  { code: '90', country: 'TR' },
  { code: '98', country: 'IR' },
  { code: '92', country: 'PK' },
  { code: '91', country: 'IN' },
  { code: '93', country: 'AF' },
  { code: '880', country: 'BD' },
  { code: '977', country: 'NP' },
  { code: '94', country: 'LK' },
  { code: '63', country: 'PH' },
  { code: '62', country: 'ID' },
  { code: '60', country: 'MY' },
  { code: '86', country: 'CN' },
  { code: '81', country: 'JP' },
  { code: '82', country: 'KR' },
  { code: '251', country: 'ET' },
  { code: '254', country: 'KE' },
  { code: '234', country: 'NG' },
  { code: '27', country: 'ZA' },
  { code: '44', country: 'GB' },
  { code: '49', country: 'DE' },
  { code: '33', country: 'FR' },
  { code: '39', country: 'IT' },
  { code: '34', country: 'ES' },
  { code: '31', country: 'NL' },
  { code: '41', country: 'CH' },
  { code: '43', country: 'AT' },
  { code: '46', country: 'SE' },
  { code: '47', country: 'NO' },
  { code: '45', country: 'DK' },
  { code: '353', country: 'IE' },
  { code: '61', country: 'AU' },
  { code: '64', country: 'NZ' },
  { code: '55', country: 'BR' },
  { code: '52', country: 'MX' },
  { code: '1' },
  { code: '7' },
];

const KNOWN_DIAL_CODES = new Set(DIAL_CODES.map((entry) => entry.code));

const COUNTRY_BY_DIAL_CODE = new Map(
  DIAL_CODES.filter((entry): entry is { code: string; country: string } => entry.country !== undefined).map((entry) => [entry.code, entry.country]),
);

const DIAL_CODE_BY_COUNTRY = new Map([...COUNTRY_BY_DIAL_CODE.entries()].map(([code, country]) => [country, code]));

export const sallaCustomers = {
  listCustomers,
  buildCustomerListQuery,
  getCustomer,
  createCustomer,
  buildCreateCustomerBody,
  updateCustomer,
  buildUpdateCustomerBody,
  resolveMobile,
  addCustomersToGroup,
  buildAddCustomersToGroupBody,
  listCustomerGroups,
  withCustomerExtras,
};

export { CUSTOMER_GENDERS, CUSTOMER_STATS_FIELDS };

type CustomerGender = 'male' | 'female';

type CustomerFilters = {
  maxResults: number;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
};

type CustomerListResult = {
  customers: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

type CustomerInputFields = {
  email?: string;
  gender?: CustomerGender | string;
  birthday?: string;
  groupIds?: Array<string | number> | string;
  mobileCountryCode?: string | number;
  countryCode?: string;
};

type CreateCustomerInput = CustomerInputFields & {
  firstName: string;
  lastName: string;
  mobile: string | number;
};

type UpdateCustomerInput = CustomerInputFields & {
  firstName?: string;
  lastName?: string;
  mobile?: string | number;
};

type ResolvedMobile = {
  mobile: string;
  mobile_code_country: string;
  country_code: string | undefined;
};

type AddCustomersToGroupResult = {
  group_id: number;
  customer_ids: number[];
  count: number;
  message: string | null;
};

type CustomerGroupListResult = {
  groups: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

export type {
  CustomerGender,
  CustomerFilters,
  CustomerListResult,
  CreateCustomerInput,
  UpdateCustomerInput,
  ResolvedMobile,
  AddCustomersToGroupResult,
  CustomerGroupListResult,
};
