import { HttpError, httpClient } from '@activepieces/pieces-common';
import type {
  AsyncConvertResponse,
  ConvertResponse,
  FlatAsyncConvertResponse,
  FlatConvertResponse,
  FlatJobResponse,
  FlatResultFields,
  JobResponse,
  PrintFriendlyApiCallParams,
} from './types';

export class PrintFriendlyApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    retryable: boolean;
  }) {
    super(params.message);
    this.name = 'PrintFriendlyApiError';
    this.status = params.status;
    this.code = params.code;
    this.retryable = params.retryable;
  }
}

async function printfriendlyApiCall<T>(
  params: PrintFriendlyApiCallParams
): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method: params.method,
      url: `${PRINTFRIENDLY_BASE_URL}${params.path}`,
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: params.body,
    });
    return response.body;
  } catch (error) {
    throw toPrintFriendlyApiError(error);
  }
}

function flattenConvertResponse(
  response: ConvertResponse
): FlatConvertResponse {
  return {
    status: 'success',
    ...flattenResultFields(response),
  };
}

function flattenAsyncConvertResponse(
  response: AsyncConvertResponse
): FlatAsyncConvertResponse {
  return {
    status: response.status,
    job_id: response.job_id,
    status_url: response.status_url,
    expires_at: response.expires_at ?? null,
  };
}

function flattenJobResponse(job: JobResponse): FlatJobResponse {
  return {
    status: job.status,
    job_id: job.job_id,
    created_at: job.created_at ?? null,
    finished_at: job.finished_at ?? null,
    ...flattenResultFields(job.result),
    error_code: job.error?.code ?? null,
    error_message: job.error?.message ?? null,
    error_retryable: job.error?.retryable ?? null,
  };
}

function flattenResultFields(response?: ConvertResponse): FlatResultFields {
  return {
    output: response?.output ?? null,
    file_url: response?.file_url ?? null,
    content: response?.content ?? null,
    expires_at: response?.expires_at ?? null,
    size_bytes: response?.size_bytes ?? null,
    document_title: response?.document?.title ?? null,
    document_url: response?.document?.url ?? null,
    document_site: response?.document?.site ?? null,
    document_excerpt: response?.document?.excerpt ?? null,
    document_image: response?.document?.image ?? null,
    document_word_count: response?.document?.word_count ?? null,
    document_content_html: response?.document?.content_html ?? null,
    document_content_markdown: response?.document?.content_markdown ?? null,
    usage_plan: response?.usage?.plan ?? null,
    usage_used_this_period: response?.usage?.used_this_period ?? null,
    usage_included: response?.usage?.included ?? null,
    usage_remaining: response?.usage?.remaining ?? null,
  };
}

function toPrintFriendlyApiError(error: unknown): PrintFriendlyApiError {
  if (error instanceof HttpError) {
    const { status, body } = error.response;
    const apiError =
      isRecord(body) && isRecord(body['error']) ? body['error'] : undefined;
    const code =
      apiError && typeof apiError['code'] === 'string'
        ? apiError['code']
        : 'request_failed';
    const message =
      apiError && typeof apiError['message'] === 'string'
        ? apiError['message']
        : `PrintFriendly API request failed with HTTP status ${status}.`;

    return new PrintFriendlyApiError({
      status,
      code,
      message,
      retryable: apiError?.['retryable'] === true,
    });
  }

  if (error instanceof Error) {
    return new PrintFriendlyApiError({
      status: 0,
      code: 'network_error',
      message: error.message,
      retryable: false,
    });
  }

  return new PrintFriendlyApiError({
    status: 0,
    code: 'unknown_error',
    message: String(error),
    retryable: false,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const PRINTFRIENDLY_BASE_URL = 'https://api.printfriendly.com';
const PRINTFRIENDLY_CONVERT_PATH = '/v2/convert';
const PRINTFRIENDLY_USAGE_PATH = '/v2/usage';

export const printfriendlyApi = {
  baseUrl: PRINTFRIENDLY_BASE_URL,
  convertPath: PRINTFRIENDLY_CONVERT_PATH,
  usagePath: PRINTFRIENDLY_USAGE_PATH,
  call: printfriendlyApiCall,
  flattenConvertResponse,
  flattenAsyncConvertResponse,
  flattenJobResponse,
};
