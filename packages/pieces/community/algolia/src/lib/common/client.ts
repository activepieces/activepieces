import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

import {
  AlgoliaAuthValue,
  AlgoliaBatchResponse,
  AlgoliaBrowseResponse,
  AlgoliaDeleteByQueryResponse,
  AlgoliaIndex,
  AlgoliaIndexListResponse,
  AlgoliaPartialUpdateResponse,
  AlgoliaRecord,
  AlgoliaSearchResponse,
  AlgoliaTaskOutcome,
  AlgoliaTaskStatusResponse,
  AlgoliaWriteResult,
} from './types';
import { parseApplicationId } from './utils';

export async function validateAlgoliaAuth(auth: AlgoliaAuthValue): Promise<void> {
  await sendRequest<AlgoliaIndexListResponse>({
    auth,
    operation: 'connection check',
    method: HttpMethod.GET,
    path: '/indexes',
    queryParams: { page: '0', hitsPerPage: '1' },
  });
}

export async function listAlgoliaIndices({
  auth,
  limit = ALGOLIA_MAX_PAGE_SIZE,
}: {
  auth: AlgoliaAuthValue;
  limit?: number;
}): Promise<AlgoliaIndex[]> {
  const indices: AlgoliaIndex[] = [];
  let page = 0;

  while (indices.length < limit) {
    const response = await sendRequest<AlgoliaIndexListResponse>({
      auth,
      operation: 'list indices',
      method: HttpMethod.GET,
      path: '/indexes',
      queryParams: {
        page: String(page),
        hitsPerPage: String(ALGOLIA_MAX_PAGE_SIZE),
      },
    });

    indices.push(...response.items);

    if (response.items.length === 0 || page + 1 >= response.nbPages) {
      break;
    }

    page += 1;
  }

  return indices.slice(0, limit);
}

export async function saveAlgoliaRecords({
  auth,
  indexName,
  records,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  records: AlgoliaRecord[];
}): Promise<AlgoliaWriteResult> {
  return sendBatches({
    auth,
    indexName,
    operation: 'save records',
    requests: records.map((record) => ({
      action: 'addObject',
      body: record,
    })),
  });
}

export async function deleteAlgoliaRecords({
  auth,
  indexName,
  objectIDs,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  objectIDs: string[];
}): Promise<AlgoliaWriteResult> {
  return sendBatches({
    auth,
    indexName,
    operation: 'delete records',
    requests: objectIDs.map((objectID) => ({
      action: 'deleteObject',
      body: { objectID },
    })),
  });
}

export async function browseAlgoliaRecords({
  auth,
  indexName,
  limit = 10_000,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  limit?: number;
}): Promise<AlgoliaRecord[]> {
  const records: AlgoliaRecord[] = [];
  let cursor: string | undefined;

  do {
    const hitsPerPage = Math.min(limit - records.length, ALGOLIA_MAX_PAGE_SIZE);
    const response = await sendRequest<AlgoliaBrowseResponse>({
      auth,
      operation: 'browse records',
      method: HttpMethod.POST,
      path: `/indexes/${encodeURIComponent(indexName)}/browse`,
      body: cursor ? { cursor } : { hitsPerPage },
    });

    records.push(...response.hits);
    cursor = response.cursor;
  } while (cursor && records.length < limit);

  return records.slice(0, limit);
}

export async function searchAlgoliaRecords({
  auth,
  indexName,
  query,
  filters,
  hitsPerPage,
  page,
  attributesToRetrieve,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  query: string;
  filters?: string;
  hitsPerPage: number;
  page: number;
  attributesToRetrieve?: string[];
}): Promise<AlgoliaSearchResponse> {
  return sendRequest<AlgoliaSearchResponse>({
    auth,
    operation: 'search records',
    method: HttpMethod.POST,
    path: `/indexes/${encodeURIComponent(indexName)}/query`,
    body: {
      query,
      hitsPerPage,
      page,
      ...(filters ? { filters } : {}),
      ...(attributesToRetrieve ? { attributesToRetrieve } : {}),
    },
  });
}

export async function getAlgoliaRecord({
  auth,
  indexName,
  objectID,
  attributesToRetrieve,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  objectID: string;
  attributesToRetrieve?: string[];
}): Promise<AlgoliaRecord> {
  return sendRequest<AlgoliaRecord>({
    auth,
    operation: 'get record',
    method: HttpMethod.GET,
    path: `/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(objectID)}`,
    notFoundMessage: `Algolia get record failed: no record with objectID "${objectID}" exists in index "${indexName}" (or the index does not exist).`,
    ...(attributesToRetrieve
      ? { queryParams: { attributesToRetrieve: attributesToRetrieve.join(',') } }
      : {}),
  });
}

export async function partialUpdateAlgoliaRecord({
  auth,
  indexName,
  objectID,
  attributes,
  createIfNotExists,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  objectID: string;
  attributes: AlgoliaRecord;
  createIfNotExists: boolean;
}): Promise<AlgoliaPartialUpdateResponse & AlgoliaTaskOutcome> {
  const operation = 'update record attributes';
  const response = await sendRequest<AlgoliaPartialUpdateResponse>({
    auth,
    operation,
    method: HttpMethod.POST,
    path: `/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(objectID)}/partial`,
    queryParams: { createIfNotExists: String(createIfNotExists) },
    body: attributes,
    isWrite: true,
  });

  const outcome = await waitForTask({
    auth,
    indexName,
    taskId: response.taskID,
    operation,
  });

  return { ...response, ...outcome };
}

export async function deleteAlgoliaRecordsByFilter({
  auth,
  indexName,
  filters,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  filters: string;
}): Promise<{ taskID: number } & AlgoliaTaskOutcome> {
  const operation = 'delete records by filter';
  const response = await sendRequest<AlgoliaDeleteByQueryResponse>({
    auth,
    operation,
    method: HttpMethod.POST,
    path: `/indexes/${encodeURIComponent(indexName)}/deleteByQuery`,
    body: { filters },
    isWrite: true,
  });

  const outcome = await waitForTask({
    auth,
    indexName,
    taskId: response.taskID,
    operation,
  });

  return { taskID: response.taskID, ...outcome };
}

export async function getAlgoliaIndexSettings({
  auth,
  indexName,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
}): Promise<Record<string, unknown>> {
  return sendRequest<Record<string, unknown>>({
    auth,
    operation: 'get index settings',
    method: HttpMethod.GET,
    path: `/indexes/${encodeURIComponent(indexName)}/settings`,
    notFoundMessage: `Algolia get index settings failed: index "${indexName}" does not exist.`,
  });
}

export function mapAlgoliaError({
  error,
  operation,
  isWrite,
  notFoundMessage,
}: {
  error: unknown;
  operation: string;
  isWrite: boolean;
  notFoundMessage?: string;
}): Error {
  const mayBeApplied = isWrite
    ? ' The change may still have been applied; check the index before retrying.'
    : '';
  const response = readErrorResponse(error);

  if (response === undefined) {
    const reason = error instanceof Error ? error.message : String(error);
    return new Error(
      `Algolia ${operation} failed: could not get a response from Algolia (${reason}).${mayBeApplied}`,
    );
  }

  if (response.status === 404 && notFoundMessage) {
    return new Error(notFoundMessage);
  }

  const vendorMessage = readVendorMessage(response.body);
  const details = [
    vendorMessage,
    ALGOLIA_STATUS_HINTS[response.status],
    response.status >= 500 ? mayBeApplied.trim() : undefined,
  ].filter((part): part is string => part !== undefined && part.length > 0);

  return new Error(
    `Algolia ${operation} failed (${response.status}): ${details.join(' — ')}`,
  );
}

async function sendBatches({
  auth,
  indexName,
  operation,
  requests,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  operation: string;
  requests: Record<string, unknown>[];
}): Promise<AlgoliaWriteResult> {
  const objectIDs: string[] = [];
  let lastTaskId = 0;

  for (let start = 0; start < requests.length; start += ALGOLIA_MAX_BATCH_SIZE) {
    const chunk = requests.slice(start, start + ALGOLIA_MAX_BATCH_SIZE);
    const { data: response, error } = await tryRequest(() =>
      sendRequest<AlgoliaBatchResponse>({
        auth,
        operation,
        method: HttpMethod.POST,
        path: `/indexes/${encodeURIComponent(indexName)}/batch`,
        body: { requests: chunk },
        isWrite: true,
      }),
    );

    if (error) {
      if (start === 0) {
        throw error;
      }
      throw new Error(
        `${error.message} The first ${start} of ${requests.length} records were already sent in earlier batches.`,
      );
    }

    objectIDs.push(...(response.objectIDs ?? []));
    lastTaskId = response.taskID;
  }

  const outcome = await waitForTask({
    auth,
    indexName,
    taskId: lastTaskId,
    operation,
  });

  return { taskID: lastTaskId, objectIDs, ...outcome };
}

async function waitForTask({
  auth,
  indexName,
  taskId,
  operation,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  taskId: number;
  operation: string;
}): Promise<AlgoliaTaskOutcome> {
  const deadline = Date.now() + ALGOLIA_TASK_DEADLINE_MILLISECONDS;

  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    const { data: response } = await tryRequest(() =>
      sendRequest<AlgoliaTaskStatusResponse>({
        auth,
        operation: `${operation} (task status)`,
        method: HttpMethod.GET,
        path: `/indexes/${encodeURIComponent(indexName)}/task/${taskId}`,
        timeout: Math.max(1, Math.min(ALGOLIA_TASK_POLL_TIMEOUT_MILLISECONDS, remaining)),
      }),
    );

    if (response === null) {
      return {
        status: 'notPublished',
        note: `Algolia accepted the write (task ${taskId}) but its status could not be checked; it may still be applied. Check the index before retrying.`,
      };
    }

    if (response.status === 'published') {
      return { status: 'published' };
    }

    const waitFor = Math.min(ALGOLIA_TASK_POLL_INTERVAL_MILLISECONDS, deadline - Date.now());
    if (waitFor > 0) {
      await sleep(waitFor);
    }
  }

  return {
    status: 'notPublished',
    note: `Algolia accepted the write (task ${taskId}) but it was still being applied after 30 seconds; it will still be applied. Do not retry.`,
  };
}

async function sendRequest<TResponse>({
  auth,
  operation,
  method,
  path,
  body,
  queryParams,
  isWrite = false,
  notFoundMessage,
  timeout,
}: {
  auth: AlgoliaAuthValue;
  operation: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
  isWrite?: boolean;
  notFoundMessage?: string;
  timeout?: number;
}): Promise<TResponse> {
  const applicationId = parseApplicationId(auth.props.applicationId);
  const request: HttpRequest<Record<string, unknown>> = {
    method,
    url: `https://${applicationId}.algolia.net/1${path}`,
    headers: {
      'x-algolia-application-id': applicationId,
      'x-algolia-api-key': auth.props.apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: timeout ?? ALGOLIA_REQUEST_TIMEOUT_MILLISECONDS,
    ...(body ? { body } : {}),
    ...(queryParams ? { queryParams } : {}),
  };

  try {
    const response = await httpClient.sendRequest<TResponse>(request);
    return response.body;
  } catch (error) {
    throw mapAlgoliaError({ error, operation, isWrite, notFoundMessage });
  }
}

async function tryRequest<T>(
  fn: () => Promise<T>,
): Promise<{ data: T; error: null } | { data: null; error: Error }> {
  try {
    return { data: await fn(), error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

function readErrorResponse(
  error: unknown,
): { status: number; body: unknown } | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (
    typeof response !== 'object' ||
    response === null ||
    !('status' in response) ||
    typeof response.status !== 'number' ||
    response.status === 0
  ) {
    return undefined;
  }
  return { status: response.status, body: 'body' in response ? response.body : undefined };
}

function readVendorMessage(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
    return body.message;
  }
  if (typeof body === 'string' && body.trim().length > 0) {
    return body.slice(0, 500);
  }
  return 'no error message returned';
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

const ALGOLIA_MAX_PAGE_SIZE = 1000;
const ALGOLIA_MAX_BATCH_SIZE = 1000;
const ALGOLIA_TASK_DEADLINE_MILLISECONDS = 30_000;
const ALGOLIA_TASK_POLL_TIMEOUT_MILLISECONDS = 5_000;
const ALGOLIA_TASK_POLL_INTERVAL_MILLISECONDS = 1000;
const ALGOLIA_REQUEST_TIMEOUT_MILLISECONDS = 60_000;
const ALGOLIA_STATUS_HINTS: Record<number, string> = {
  401: 'Check the Application ID and API key.',
  403: 'The API key is missing the ACL needed for this operation, or the Application ID is wrong.',
  404: 'The index or record does not exist.',
  429: 'Algolia rate limit reached; try again later.',
};
