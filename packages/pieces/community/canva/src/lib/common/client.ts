import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export interface CanvaApiCallParams {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}

export interface CanvaApiCallRawParams {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  body: Buffer;
}

/**
 * Makes a JSON API call to the Canva REST API
 */
export async function canvaApiCall<T = any>(
  params: CanvaApiCallParams
): Promise<T> {
  const { auth, method, path, body, queryParams } = params;

  const request: HttpRequest = {
    method,
    url: `${CANVA_API_BASE}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    request.body = body;
  }

  if (queryParams) {
    request.queryParams = queryParams;
  }

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

/**
 * Makes a raw (binary) API call to the Canva REST API.
 * Used for asset uploads and design imports which require
 * application/octet-stream content type with metadata headers.
 */
export async function canvaApiCallRaw(
  params: CanvaApiCallRawParams
): Promise<any> {
  const { auth, method, path, headers, body } = params;

  const response = await httpClient.sendRequest({
    method,
    url: `${CANVA_API_BASE}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    headers,
    body,
  });

  return response.body;
}

/**
 * Polls an export job until completion.
 * Export status endpoint: GET /v1/exports/{exportId}
 */
export async function pollExportJob(
  auth: OAuth2PropertyValue,
  jobId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const job = await canvaApiCall({
      auth,
      method: HttpMethod.GET,
      path: `/exports/${jobId}`,
    });

    if (job.job?.status === 'success') {
      return job;
    }

    if (job.job?.status === 'failed') {
      throw new Error(
        `Export job failed: ${job.job.error?.message || 'Unknown error'}`
      );
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Export job timed out after maximum attempts');
}

/**
 * Polls an import job until completion.
 * Import status endpoint: GET /v1/imports/{importId}
 */
export async function pollImportJob(
  auth: OAuth2PropertyValue,
  jobId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const job = await canvaApiCall({
      auth,
      method: HttpMethod.GET,
      path: `/imports/${jobId}`,
    });

    if (job.job?.status === 'success') {
      return job;
    }

    if (job.job?.status === 'failed') {
      throw new Error(
        `Import job failed: ${job.job.error?.message || 'Unknown error'}`
      );
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Import job timed out after maximum attempts');
}
