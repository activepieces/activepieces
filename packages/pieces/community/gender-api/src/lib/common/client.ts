import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

async function request<T>({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${GENDER_API_BASE_URL}${path}`,
      headers,
      body,
    });
    return response.body;
  } catch (error) {
    const response = readErrorResponse(error);
    if (!response) {
      throw error;
    }
    throw new GenderApiError({
      status: response.status,
      responseBody: response.body,
    });
  }
}

function readErrorResponse(
  error: unknown
): { status: number; body: unknown } | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (
    typeof response !== 'object' ||
    response === null ||
    !('status' in response) ||
    typeof response.status !== 'number'
  ) {
    return undefined;
  }
  return {
    status: response.status,
    body: 'body' in response ? response.body : undefined,
  };
}

function readField({ body, key }: { body: unknown; key: string }): string | undefined {
  if (typeof body !== 'object' || body === null || !(key in body)) {
    return undefined;
  }
  const value: unknown = Reflect.get(body, key);
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function trimPunctuation(text: string): string {
  return text.trim().replace(/[.!?;:,\s]+$/, '');
}

function buildMessage({
  status,
  responseBody,
}: {
  status: number;
  responseBody: unknown;
}): string {
  const vendorText =
    readField({ body: responseBody, key: 'detail' }) ??
    readField({ body: responseBody, key: 'title' }) ??
    readField({ body: responseBody, key: 'error' }) ??
    readField({ body: responseBody, key: 'message' }) ??
    (typeof responseBody === 'string' && responseBody.trim() !== ''
      ? responseBody
      : undefined);
  const base = vendorText
    ? `Gender API request failed (${status}): ${trimPunctuation(vendorText)}`
    : `Gender API request failed (${status})`;
  const upgradeUrl = readField({ body: responseBody, key: 'upgrade_url' });
  const errorCode = readField({ body: responseBody, key: 'error' }) ?? readField({ body: responseBody, key: 'type' }) ?? '';
  if (upgradeUrl || errorCode.includes('limit-exceeded')) {
    return `${base}. Your Gender API credits are used up${upgradeUrl ? `; upgrade at ${upgradeUrl}` : ''}.`;
  }
  if (errorCode.includes('auth') || status === 401 || status === 403) {
    return `${base}. Check that the API key is correct and that your Gender API account email is activated.`;
  }
  return `${base}.`;
}

class GenderApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ status, responseBody }: { status: number; responseBody: unknown }) {
    super(buildMessage({ status, responseBody }));
    this.name = 'GenderApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(Object.entries(value));
}

function normalizeGenderResult(body: unknown): GenderResult {
  const data = toRecord(body);
  const details = toRecord(data['details']);
  return {
    gender: toText(data['gender']) ?? 'unknown',
    probability: toNumber(data['probability']),
    result_found: data['result_found'] === true,
    first_name: toText(data['first_name']),
    last_name: toText(data['last_name']),
    samples: toNumber(details['samples']),
    country: toText(details['country']),
    credits_used: toNumber(details['credits_used']),
  };
}

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildLookupBody({
  key,
  value,
  countryCode,
  locale,
}: {
  key: string;
  value: string;
  countryCode: string | null | undefined;
  locale: string | null | undefined;
}): Record<string, unknown> {
  const body: Record<string, unknown> = { [key]: value };
  const country = optionalText(countryCode);
  if (country) {
    body['country'] = country.toUpperCase();
  }
  const trimmedLocale = optionalText(locale);
  if (trimmedLocale) {
    body['locale'] = trimmedLocale;
  }
  return body;
}

function normalizeGenderResultKeepingRaw(body: unknown): Record<string, unknown> {
  return { ...normalizeGenderResult(body), ...toRecord(body) };
}

const genderResultFields: OutputSchemaField[] = [
  { key: 'gender', label: 'Gender', description: 'Predicted gender: male, female or unknown (unknown when the name is not found)' },
  { key: 'probability', label: 'Probability', format: 'number', description: 'Confidence between 0 and 1' },
  { key: 'result_found', label: 'Result Found', format: 'boolean' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'samples', label: 'Samples', format: 'number', description: 'Number of records the prediction is based on' },
  { key: 'country', label: 'Country', description: 'Country applied to the lookup' },
  { key: 'credits_used', label: 'Credits Used', format: 'number' },
];

const genderResultOutputSchema: OutputSchema = { fields: genderResultFields };

const rawGenderFields: OutputSchemaField[] = [
  {
    key: 'input',
    label: 'Input',
    description: 'The request parameters echoed back by Gender API',
    children: [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'full_name', label: 'Full Name' },
      { key: 'country', label: 'Country' },
      { key: 'locale', label: 'Locale' },
    ],
  },
  {
    key: 'details',
    label: 'Details',
    description: 'Lookup details as returned by Gender API',
    children: [
      { key: 'credits_used', label: 'Credits Used', format: 'number' },
      { key: 'samples', label: 'Samples', format: 'number' },
      { key: 'country', label: 'Country' },
      { key: 'first_name_sanitized', label: 'First Name Sanitized' },
      { key: 'duration', label: 'Duration' },
    ],
  },
];

const genderResultWithRawOutputSchema: OutputSchema = {
  fields: [
    ...genderResultFields.map((field) =>
      field.key === 'gender'
        ? { ...field, description: 'Predicted gender: male, female, or null when the name is not found' }
        : field
    ),
    ...rawGenderFields,
  ],
};

const GENDER_API_BASE_URL = 'https://gender-api.com/v2';

export const genderApiCommon = {
  baseUrl: GENDER_API_BASE_URL,
  request,
  buildLookupBody,
  normalizeGenderResult,
  normalizeGenderResultKeepingRaw,
  toNumber,
  toRecord,
  toText,
  genderResultOutputSchema,
  genderResultWithRawOutputSchema,
};

type GenderResult = {
  gender: string;
  probability: number | null;
  result_found: boolean;
  first_name: string | null;
  last_name: string | null;
  samples: number | null;
  country: string | null;
  credits_used: number | null;
};
