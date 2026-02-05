import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { ampecoAuth } from './auth';

/**
 * Ampeco API Utilities
 * Generated from API version: 3.96.4
 */

/**
 * Custom auth type for Ampeco
 */
export interface AmpecoAuthType {
  baseApiUrl: string;
  token: string;
}

/**
 * API Error response interface
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

/**
 * Make API call to Ampeco API
 * @param auth Authentication object
 * @param path API path or full URL
 * @param method HTTP method
 * @param body Request body
 * @param queryParams Query parameters
 * @returns API response
 */
export async function makeAmpecoApiCall(
  auth: AppConnectionValueForAuthProperty<typeof ampecoAuth>,
  path: string,
  method: HttpMethod,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>
): Promise<unknown> {
  let url: string;

  // Check if path is already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path;
  } else {
    // Build URL from base URL and path
    const baseUrl = auth.props.baseApiUrl || '';
    const normalizedBaseUrl = baseUrl.endsWith('/')
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    url = `${normalizedBaseUrl}${normalizedPath}`;
  }

  if (!queryParams) {
    queryParams = {};
  }

  if (!('cursor' in queryParams) && !('page' in queryParams)) {
    queryParams = {
      ...queryParams,
      cursor: 'null',
    };
  }

  const request: HttpRequest = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.props.token}`,
    },
    queryParams,
    body,
  };

  const response = await httpClient.sendRequest(request);

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `API call failed with status ${response.status}: ${JSON.stringify(
        response.body
      )}`
    );
  }

  return response.body;
}

/**
 * Process path parameters in URL
 * @param url URL with path parameters
 * @param params Parameters object
 * @returns Processed URL
 */
export function processPathParameters(
  url: string,
  params: Record<string, unknown>
): string {
  let processedUrl = url;

  // Replace path parameters in URL
  const pathParams = url.match(/\{([^}]+)\}/g);
  if (pathParams) {
    for (const param of pathParams) {
      const paramName = param.slice(1, -1);
      const paramValue = params[paramName];

      if (!isNil(paramValue)) {
        processedUrl = processedUrl.replace(
          param,
          encodeURIComponent(String(paramValue))
        );
      }
    }
  }

  return processedUrl;
}

/**
 * Flatten object to query parameters with proper nesting
 * @param obj Object to flatten
 * @param prefix Prefix for keys
 * @returns Flattened query parameters
 */
function flattenToQueryParams(
  obj: Record<string, unknown>,
  prefix: string
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = `${prefix}[${key}]`;

    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayKey = `${newKey}[${index}]`;
        if (typeof item === 'object' && item !== null) {
          Object.assign(
            result,
            flattenToQueryParams(item as Record<string, unknown>, arrayKey)
          );
        } else {
          result[arrayKey] = String(item);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(
        result,
        flattenToQueryParams(value as Record<string, unknown>, newKey)
      );
    } else {
      result[newKey] = String(value);
    }
  }

  return result;
}

function isDeepEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true;

  // If it's a primitive or function, it's not empty
  if (typeof obj !== 'object') return false;

  // If it's an array, check all items
  if (Array.isArray(obj)) {
    return obj.every(isDeepEmpty);
  }

  // If it's an object, check all keys
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (!isDeepEmpty(obj[key])) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Reconstruct nested objects from flattened property names
 * @param params Parameters object with flattened properties
 * @returns Object with reconstructed nested structure
 */
export function reconstructNestedObjects(
  params: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    // Special case for oneOf, anyOf variant fields
    if (key.includes('_VariantType')) {
      continue;
    }

    const parts = key.split('__');
    let current: Record<string, any> = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (
        current[part] === undefined ||
        typeof current[part] !== 'object' ||
        current[part] === null
      ) {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    let processedValue = value;

    // If the value is an object, recursively process it.
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      processedValue = reconstructNestedObjects(
        value as Record<string, unknown>
      );

      // If the processed value is an object with a single key that matches `lastPart`,
      // and the value of that key is also an object, we merge them to prevent double nesting.
      const processedKeys = Object.keys(processedValue);
      if (processedKeys.length === 1 && processedKeys[0] === lastPart) {
        const nestedValue = (processedValue as Record<string, unknown>)[
          lastPart
        ];
        if (
          typeof nestedValue === 'object' &&
          nestedValue !== null &&
          !Array.isArray(nestedValue)
        ) {
          processedValue = nestedValue;
        }
      }
    }

    // Merge if both existing and new values are objects
    if (
      typeof current[lastPart] === 'object' &&
      current[lastPart] !== null &&
      typeof processedValue === 'object' &&
      processedValue !== null &&
      !Array.isArray(current[lastPart]) &&
      !Array.isArray(processedValue)
    ) {
      current[lastPart] = { ...current[lastPart], ...processedValue };
    } else {
      current[lastPart] = processedValue;
    }
  }

  return result;
}

/**
 * Prepare query parameters
 * @param params Parameters object
 * @param includeKeys Keys to include in query parameters (empty array means include all except internal props)
 * @returns Query parameters object
 */
export function prepareQueryParams(
  params: Record<string, unknown>,
  includeKeys: string[] = []
): Record<string, string> {
  const queryParams: Record<string, string> = {};
  const internalProps = ['usePagination', 'auth']; // Always exclude internal props

  // First, reconstruct nested objects from flattened properties
  const reconstructedParams = reconstructNestedObjects(params);

  for (const [key, value] of Object.entries(reconstructedParams)) {
    if (!Object.prototype.hasOwnProperty.call(reconstructedParams, key)) {
      continue;
    }

    if (internalProps.includes(key) || value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    if (includeKeys.length === 0 || !includeKeys.includes(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayKey = `${key}[${index}]`;
        if (typeof item === 'object' && item !== null) {
          Object.assign(
            queryParams,
            flattenToQueryParams(item as Record<string, unknown>, arrayKey)
          );
        } else {
          queryParams[arrayKey] = String(item);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(
        queryParams,
        flattenToQueryParams(value as Record<string, unknown>, key)
      );
    } else {
      queryParams[key] = String(value);
    }
  }

  return queryParams;
}

/**
 * Prepare request body from parameters
 * @param params Parameters object
 * @param includeKeys Keys to include in request body (empty array means include all except internal props)
 * @returns Request body object
 */
export function prepareRequestBody(
  params: Record<string, unknown>,
  includeKeys: string[] = []
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const internalProps = ['usePagination', 'auth']; // Always exclude internal props

  const reconstructedParams = reconstructNestedObjects(params);

  for (const [key, value] of Object.entries(reconstructedParams)) {
    if (!Object.prototype.hasOwnProperty.call(reconstructedParams, key))
      continue;

    if (internalProps.includes(key) || value === undefined || value === null) {
      continue;
    }

    if (isDeepEmpty(value)) {
      continue;
    }

    // Special case: if key is 'requestBody' and value is an array, add array values directly
    if (key === 'requestBody') {
      for (const [akey, avalue] of Object.entries(value)) {
        if (avalue !== undefined && avalue !== null) {
          body[akey] = avalue;
        }
      }
      continue;
    }

    if (includeKeys.length === 0 || !includeKeys.includes(key)) {
      continue;
    }

    // Include the value as-is (arrays, objects, primitives)
    body[key] = value;
  }

  return body;
}

/**
 * Paginate through API results
 * @param options Pagination options
 * @returns Combined results
 */
export async function paginate({
  auth,
  method,
  path,
  queryParams = {},
  body,
  perPage = 100,
  dataPath = 'data',
}: {
  auth: AppConnectionValueForAuthProperty<typeof ampecoAuth>;
  method: string;
  path: string;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown>;
  perPage?: number;
  dataPath?: string;
}): Promise<unknown> {
  try {
    return await paginateWithCursor({
      auth,
      method,
      path,
      queryParams,
      body,
      perPage,
      dataPath,
    });
  } catch (error) {
    throw new Error(
      `Pagination failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Paginate through Ampeco API results using cursor-based pagination
 * @param options Pagination options
 * @returns Combined results
 */
async function paginateWithCursor({
  auth,
  method,
  path,
  queryParams = {},
  body,
  perPage = 100,
  dataPath = 'data',
}: {
  auth: AppConnectionValueForAuthProperty<typeof ampecoAuth>;
  method: string;
  path: string;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown>;
  perPage?: number;
  dataPath?: string;
}): Promise<unknown> {
  const aggregatedResults: unknown[] = [];
  const pageSize = Math.min(100, perPage); // Ampeco API has a max page size of 100

  // Initial API call setup
  let nextPageUrl: string | null = path;
  let requestQueryParams: Record<string, string> = {
    ...queryParams,
    per_page: String(pageSize),
    cursor: 'null',
  };
  let firstResponse: unknown = null;

  while (nextPageUrl && aggregatedResults.length < perPage) {
    const response = await makeAmpecoApiCall(
      auth,
      nextPageUrl,
      method as HttpMethod,
      body,
      requestQueryParams
    );

    if (firstResponse === null) {
      firstResponse = response;
    }

    const data = extractDataFromResponse(
      response as Record<string, unknown>,
      dataPath
    );
    if (data.length === 0) {
      break; // No more data to fetch
    }

    aggregatedResults.push(...data);

    // Determine the URL for the next page from the 'links.next' property
    const links = (response as Record<string, any>)?.['links'];
    nextPageUrl = links?.['next'] ?? null;

    // For subsequent requests, the full URL is in `nextPageUrl`, so we don't need to pass query params separately.
    if (nextPageUrl) {
      requestQueryParams = {};
    }
  }

  // If no API call was successful, we can't determine the response structure.
  // Returning a default object structure is a safe fallback.
  if (firstResponse === null) {
    return { [dataPath]: [] };
  }

  // Reconstruct the final response object with the aggregated data, preserving the original structure.
  const paginatedData = aggregatedResults.slice(0, perPage);

  if (Array.isArray(firstResponse)) {
    return paginatedData;
  }

  if (typeof firstResponse === 'object') {
    const finalResponse = { ...(firstResponse as Record<string, unknown>) };
    finalResponse[dataPath] = paginatedData;

    // Nullify the 'next' link in the final response as we've fetched all pages.
    if (finalResponse['links'] && typeof finalResponse['links'] === 'object') {
      (finalResponse['links'] as Record<string, unknown>)['next'] = null;
    }

    return finalResponse;
  }

  // Fallback for unexpected response types (e.g., string, number).
  return paginatedData;
}

/**
 * Extract data array from API response
 * @param response API response object
 * @param dataPath Path to data in response
 * @returns Array of data items
 */
export function extractDataFromResponse(
  response: Record<string, unknown>,
  dataPath = 'data'
): unknown[] {
  // Try to get data from the specified path
  if (response && typeof response === 'object' && dataPath in response) {
    const data = response[dataPath];
    if (Array.isArray(data)) {
      return data;
    }
  }

  // If response itself is an array, return it
  if (Array.isArray(response)) {
    return response;
  }

  throw new Error(`Could not find array data at '${dataPath}' in API response`);
}

/**
 * Handle API errors consistently
 * @param error Error object from API call
 * @throws Error with formatted error message
 */
export function handleApiError(error: unknown): never {
  // Define specific types for error handling
  interface HttpError {
    response?: {
      status?: number;
      data?: ApiErrorResponse;
      body?: ApiErrorResponse;
    };
    request?: unknown;
  }

  // Handle HTTP errors with response
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as HttpError).response !== undefined
  ) {
    const httpError = error as HttpError;
    const statusCode = httpError.response?.status;
    const errorData =
      httpError.response?.data || httpError.response?.body || {};

    throw new Error(
      `API call failed (Status ${statusCode}): ${
        errorData.message ||
        errorData.error ||
        JSON.stringify(errorData) ||
        'Unknown error'
      }`
    );
  }
  // Handle network errors (no response received)
  else if (
    typeof error === 'object' &&
    error !== null &&
    'request' in error &&
    (error as HttpError).request !== undefined
  ) {
    throw new Error(`Network Error: No response received from API`);
  }
  // Handle all other errors
  else {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error: ${errorMessage || 'Unknown error occurred'}`);
  }
}
