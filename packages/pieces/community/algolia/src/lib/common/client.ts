import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

import { AlgoliaAuthValue, AlgoliaBatchResponse, AlgoliaBrowseResponse, AlgoliaIndex, AlgoliaIndexListResponse, AlgoliaRecord, AlgoliaTaskStatusResponse } from './types';

export async function validateAlgoliaAuth(auth: AlgoliaAuthValue): Promise<void> {
  await listAlgoliaIndices({
    auth,
    limit: 1,
  });
}

export async function listAlgoliaIndices({
  auth,
  limit = 1000,
}: {
  auth: AlgoliaAuthValue;
  limit?: number;
}): Promise<AlgoliaIndex[]> {
  const indices: AlgoliaIndex[] = [];
  let page = 0;

  while (indices.length < limit) {
    const remaining = limit - indices.length;
    const response = await sendRequest<AlgoliaIndexListResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/indexes',
      queryParams: {
        page: String(page),
        hitsPerPage: String(Math.min(remaining, ALGOLIA_MAX_PAGE_SIZE)),
      },
    });

    indices.push(...response.items);

    if (response.items.length === 0 || page + 1 >= response.nbPages) {
      break;
    }

    page += 1;
  }

  return indices;
}

export async function saveAlgoliaRecords({
  auth,
  indexName,
  records,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  records: AlgoliaRecord[];
}): Promise<AlgoliaBatchResponse> {
  const response = await sendRequest<AlgoliaBatchResponse>({
    auth,
    method: HttpMethod.POST,
    path: `/indexes/${encodeURIComponent(indexName)}/batch`,
    body: {
      requests: records.map((record) => ({
        action: 'addObject',
        body: record,
      })),
    },
  });

  await waitForTask({
    auth,
    indexName,
    taskId: response.taskID,
  });

  return response;
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
    const response = await sendRequest<AlgoliaBrowseResponse>({
      auth,
      method: HttpMethod.POST,
      path: `/indexes/${encodeURIComponent(indexName)}/browse`,
      body: cursor ? { cursor } : {},
    });

    records.push(...response.hits);
    cursor = response.cursor;
  } while (cursor && records.length < limit);

  return records.slice(0, limit);
}

export async function deleteAlgoliaRecords({
  auth,
  indexName,
  objectIDs,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  objectIDs: string[];
}): Promise<AlgoliaBatchResponse> {
  const response = await sendRequest<AlgoliaBatchResponse>({
    auth,
    method: HttpMethod.POST,
    path: `/indexes/${encodeURIComponent(indexName)}/batch`,
    body: {
      requests: objectIDs.map((objectID) => ({
        action: 'deleteObject',
        body: {
          objectID,
        },
      })),
    },
  });

  await waitForTask({
    auth,
    indexName,
    taskId: response.taskID,
  });

  return response;
}

async function waitForTask({
  auth,
  indexName,
  taskId,
}: {
  auth: AlgoliaAuthValue;
  indexName: string;
  taskId: number;
}): Promise<void> {
  for (let attempt = 0; attempt < ALGOLIA_TASK_MAX_ATTEMPTS; attempt += 1) {
    const response = await sendRequest<AlgoliaTaskStatusResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/indexes/${encodeURIComponent(indexName)}/task/${taskId}`,
    });

    if (response.status === 'published') {
      return;
    }

    await sleep(ALGOLIA_TASK_POLL_INTERVAL_MILLISECONDS);
  }

  throw new Error('The Algolia operation is taking too long. Try again or check your Algolia dashboard for the task status.');
}

async function sendRequest<TResponse>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: AlgoliaAuthValue;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
}): Promise<TResponse> {
  const request: HttpRequest<Record<string, unknown>> = {
    method,
    url: `https://${auth.props.applicationId}.algolia.net/1${path}`,
    headers: {
      'x-algolia-application-id': auth.props.applicationId,
      'x-algolia-api-key': auth.props.apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...(body ? { body } : {}),
    ...(queryParams ? { queryParams } : {}),
  };

  const response = await httpClient.sendRequest<TResponse>(request);
  return response.body;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

const ALGOLIA_MAX_PAGE_SIZE = 1000;
const ALGOLIA_TASK_MAX_ATTEMPTS = 30;
const ALGOLIA_TASK_POLL_INTERVAL_MILLISECONDS = 1000;
