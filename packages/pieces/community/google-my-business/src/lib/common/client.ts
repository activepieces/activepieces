import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { isNil, Property } from '@activepieces/pieces-framework';

async function request<T>({ accessToken, method, url, query, body }: RequestParams): Promise<T> {
  const queryString = isNil(query) ? '' : query.toString();
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: queryString.length > 0 ? `${url}?${queryString}` : url,
      headers: { Authorization: `Bearer ${accessToken}` },
      ...(isNil(body) ? {} : { body }),
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw new Error(buildErrorMessage({ status: error.response.status, body: error.response.body }));
    }
    throw error;
  }
}

async function paginate({ accessToken, url, query, itemsKey, pageSize, maxResults }: PaginateParams): Promise<PaginateResult> {
  const items: unknown[] = [];
  let pageToken: string | undefined;
  let lastPage: Record<string, unknown> = {};
  do {
    const params = new URLSearchParams(query);
    params.set('pageSize', String(Math.min(maxResults - items.length, pageSize)));
    if (!isNil(pageToken)) {
      params.set('pageToken', pageToken);
    }
    lastPage = await request<Record<string, unknown>>({ accessToken, method: HttpMethod.GET, url, query: params });
    const pageItems = lastPage[itemsKey];
    if (Array.isArray(pageItems)) {
      items.push(...pageItems);
    }
    const next = lastPage['nextPageToken'];
    pageToken = typeof next === 'string' && next.length > 0 ? next : undefined;
  } while (!isNil(pageToken) && items.length < maxResults);
  return { items: items.slice(0, maxResults), nextPageToken: pageToken, lastPage };
}

function buildErrorMessage({ status, body }: { status: number; body: unknown }): string {
  const vendor = readVendorError(body);
  const vendorMessage = vendor.message ?? 'Unknown error';
  const suffix = `(status ${status}${isNil(vendor.status) ? '' : ` ${vendor.status}`}): ${vendorMessage}`;
  if (status === 403) {
    const disabled = vendor.reasons.some((reason) => reason === 'SERVICE_DISABLED' || reason === 'accessNotConfigured');
    if (disabled) {
      return `This Business Profile API is not enabled for the connection's Google project ${suffix}`;
    }
    return `The connected Google account does not manage this account or location ${suffix}`;
  }
  if (status === 404) {
    return `Not found; check the account, location or resource id format ${suffix}`;
  }
  if (status === 429) {
    return `Google Business Profile API quota exceeded; retry later ${suffix}`;
  }
  if (status === 400 && vendor.status === 'FAILED_PRECONDITION') {
    return `Precondition failed; the location may be unverified ${suffix}`;
  }
  return `Google Business Profile request failed ${suffix}`;
}

function readVendorError(body: unknown): VendorError {
  const empty: VendorError = { message: undefined, status: undefined, reasons: [] };
  if (!isRecord(body) || !isRecord(body['error'])) {
    return empty;
  }
  const error = body['error'];
  const details = Array.isArray(error['details']) ? error['details'] : [];
  const errors = Array.isArray(error['errors']) ? error['errors'] : [];
  const reasons = [...details, ...errors]
    .filter(isRecord)
    .map((item) => item['reason'])
    .filter((reason): reason is string => typeof reason === 'string');
  return {
    message: typeof error['message'] === 'string' ? error['message'] : undefined,
    status: typeof error['status'] === 'string' ? error['status'] : undefined,
    reasons,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function lastSegment({ value, marker }: { value: string; marker: string }): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  const parts = trimmed.split('/');
  const index = parts.lastIndexOf(marker);
  if (index >= 0 && index + 1 < parts.length) {
    return parts[index + 1];
  }
  return parts[parts.length - 1];
}

function accountName(account: string): string {
  return `accounts/${lastSegment({ value: account, marker: 'accounts' })}`;
}

function v1Location(location: string): string {
  return `locations/${lastSegment({ value: location, marker: 'locations' })}`;
}

function v4Location({ account, location }: { account: string; location: string }): string {
  return `${accountName(account)}/${v1Location(location)}`;
}

function childId({ value, marker }: { value: string; marker: string }): string {
  return lastSegment({ value, marker });
}

function reviewUrl({ account_id, location_id, review_id }: { account_id: string; location_id: string; review_id: string }): string {
  const parent = v4Location({ account: account_id, location: location_id });
  const review = childId({ value: review_id, marker: 'reviews' });
  return `https://mybusiness.googleapis.com/v4/${parent}/reviews/${encodeURIComponent(review)}`;
}

export const gmbApi = {
  request,
  paginate,
  locationReadMask:
    'name,title,storeCode,languageCode,phoneNumbers,categories,storefrontAddress,websiteUri,regularHours,specialHours,serviceArea,labels,latlng,openInfo,metadata,profile',
  resourceNames: { accountName, v1Location, v4Location, childId, reviewUrl },
  props: {
    accountId: () =>
      Property.ShortText({
        displayName: 'Account ID',
        description: 'The account id, e.g. 123 or accounts/123. Get it from the name field returned by List Accounts (list-accounts).',
        required: true,
      }),
    locationId: () =>
      Property.ShortText({
        displayName: 'Location ID',
        description: 'The location id, e.g. 456 or locations/456. Get it from the name field returned by List Locations (list-locations).',
        required: true,
      }),
    reviewId: () =>
      Property.ShortText({
        displayName: 'Review ID',
        description: 'The reviewId field returned by List Reviews (list-reviews), or the full review name.',
        required: true,
      }),
    maxResults: () =>
      Property.Number({
        displayName: 'Maximum Results',
        description: 'Stop after this many items. Larger values are fetched over several requests.',
        required: false,
        defaultValue: 100,
      }),
  },
  hosts: {
    accountManagement: 'https://mybusinessaccountmanagement.googleapis.com/v1',
    businessInformation: 'https://mybusinessbusinessinformation.googleapis.com/v1',
    v4: 'https://mybusiness.googleapis.com/v4',
    verifications: 'https://mybusinessverifications.googleapis.com/v1',
  },
};

type RequestParams = {
  accessToken: string;
  method: HttpMethod;
  url: string;
  query?: URLSearchParams;
  body?: Record<string, unknown>;
};

type PaginateParams = {
  accessToken: string;
  url: string;
  query?: URLSearchParams;
  itemsKey: string;
  pageSize: number;
  maxResults: number;
};

type PaginateResult = {
  items: unknown[];
  nextPageToken: string | undefined;
  lastPage: Record<string, unknown>;
};

type VendorError = {
  message: string | undefined;
  status: string | undefined;
  reasons: string[];
};
