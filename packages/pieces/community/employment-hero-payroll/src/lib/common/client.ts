import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { z } from 'zod';

const baseUrl = 'https://api.yourpayroll.com.au/api/v2';
const recordSchema = z.record(z.string(), z.json());
const recordsSchema = z.array(recordSchema);
const idSchema = z.coerce.number().int().positive().max(2147483647);
const pageSchema = z.object({
  limit: z.number().int().min(1).max(100).default(100),
  offset: z.number().int().min(0).default(0),
  filter: z.string().optional(),
});

async function request({
  apiKey,
  path,
  method = HttpMethod.GET,
  body,
  queryParams,
}: RequestParams) {
  const url = new URL(`${baseUrl}${path}`);
  if (
    url.origin !== new URL(baseUrl).origin ||
    !url.pathname.startsWith('/api/v2/')
  ) {
    throw new Error('Use an Employment Hero Payroll Australia API path.');
  }
  try {
    const response = await httpClient.sendRequest<unknown>({
      url: url.toString(),
      method,
      body,
      queryParams,
      authentication: {
        type: AuthenticationType.BASIC,
        username: apiKey,
        password: '',
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      followRedirects: false,
      retries: method === HttpMethod.GET ? 2 : 0,
      timeout: 30000,
    });
    if (response.status < 200 || response.status >= 300) {
      throw new HttpError(undefined, {
        status: response.status,
        responseBody: {},
      });
    }
    return response.body;
  } catch (error) {
    if (!(error instanceof HttpError)) {
      throw new Error(
        'Employment Hero Payroll could not be reached. Check the service before retrying a write; it may have succeeded.'
      );
    }
    const { status, body: responseBody } = error.response;
    const problem = z
      .object({
        detail: z.string().optional(),
        title: z.string().optional(),
        message: z.string().optional(),
        errors: z.record(z.string(), z.array(z.string())).optional(),
      })
      .safeParse(responseBody);
    const detail = problem.success
      ? problem.data.detail ?? problem.data.message ?? problem.data.title
      : undefined;
    const validation =
      problem.success && problem.data.errors
        ? Object.entries(problem.data.errors)
            .map(([field, errors]) => `${field}: ${errors.join('; ')}`)
            .join('. ')
        : undefined;
    const messages: Record<number, string> = {
      401: 'The API key is invalid. Generate a key in My Account in Employment Hero Payroll.',
      403: 'This connection does not have access to the selected business or operation.',
      404: 'The record was not found in the selected business.',
      429: 'Employment Hero Payroll has rate limited this connection. Wait before retrying.',
    };
    const message =
      messages[status] ??
      ([detail, validation].filter(Boolean).join('. ') ||
        'The request failed. Check the inputs and the payroll record before retrying.');
    throw new Error(
      `Employment Hero Payroll (${status}): ${message
        .split(apiKey)
        .join('[redacted]')}`
    );
  }
}

async function list({ apiKey, path, limit, offset, filter }: ListParams) {
  const page = pageSchema.parse({ limit, offset, filter });
  return recordsSchema.parse(
    await request({
      apiKey,
      path,
      queryParams: {
        $top: String(page.limit),
        $skip: String(page.offset),
        $orderby: 'Id',
        ...(page.filter ? { $filter: page.filter } : {}),
      },
    })
  );
}

function businessPath({
  businessId,
  resource,
}: {
  businessId: unknown;
  resource: string;
}) {
  return `/business/${idSchema.parse(businessId)}/${resource}`;
}

export const payrollClient = {
  baseUrl,
  request,
  list,
  businessPath,
  id: (value: unknown) => idSchema.parse(value),
  record: (value: unknown) => recordSchema.parse(value),
};
export type PayrollRecord = z.infer<typeof recordSchema>;
type RequestParams = {
  apiKey: string;
  path: string;
  method?: HttpMethod;
  body?: unknown;
  queryParams?: Record<string, string>;
};
type ListParams = Pick<RequestParams, 'apiKey' | 'path'> & {
  limit?: number;
  offset?: number;
  filter?: string;
};
