import {
  Client,
  FileUpload,
  LargeFileUploadTask,
  ResponseType,
} from '@microsoft/microsoft-graph-client';

import { getGraphBaseUrl } from './microsoft-cloud';

import type { GraphPage, MicrosoftSharePointAuthValue } from './types';

function baseUrl({ auth }: { auth: MicrosoftSharePointAuthValue }): string {
  return getGraphBaseUrl(auth.props?.cloud);
}

function create({ auth }: { auth: MicrosoftSharePointAuthValue }): Client {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: () => Promise.resolve(auth.access_token),
    },
    baseUrl: baseUrl({ auth }),
  });
}

async function list<T>({
  auth,
  path,
  limit,
  nextLink,
  query,
  headers,
}: {
  auth: MicrosoftSharePointAuthValue;
  path: string;
  limit: number | undefined;
  nextLink: string | undefined;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}): Promise<GraphPage<T>> {
  const client = create({ auth });
  if (nextLink) {
    if (!nextLink.startsWith(`${baseUrl({ auth })}/`)) {
      throw new Error(
        'Next Link must be the @odata.nextLink or @odata.deltaLink value returned by the previous call of this action.'
      );
    }
    const next: GraphPage<T> = await client
      .api(nextLink)
      .headers(headers ?? {})
      .get();
    return next;
  }
  const page: GraphPage<T> = await client
    .api(path)
    .headers(headers ?? {})
    .query(query ?? {})
    .top(pageSize({ limit }))
    .get();
  return page;
}

async function download({
  auth,
  path,
}: {
  auth: MicrosoftSharePointAuthValue;
  path: string;
}): Promise<Buffer> {
  const content: ArrayBuffer = await create({ auth })
    .api(path)
    .responseType(ResponseType.ARRAYBUFFER)
    .get();
  return Buffer.from(content);
}

async function postRaw({
  auth,
  path,
  body,
}: {
  auth: MicrosoftSharePointAuthValue;
  path: string;
  body: Record<string, unknown>;
}): Promise<Response> {
  const response: Response = await create({ auth })
    .api(path)
    .responseType(ResponseType.RAW)
    .post(body);
  return response;
}

async function postForLocation({
  auth,
  path,
  body,
}: {
  auth: MicrosoftSharePointAuthValue;
  path: string;
  body: Record<string, unknown>;
}): Promise<{ status: number; location: string | null; body: string }> {
  const response = await postRaw({ auth, path, body });
  if (!response.ok) {
    throw new Error(`Microsoft Graph returned ${response.status}: ${await response.text()}`);
  }
  return {
    status: response.status,
    location: response.headers.get('Location'),
    body: await response.text(),
  };
}

async function uploadLargeFile({
  auth,
  sessionPath,
  data,
  fileName,
  conflictBehavior,
}: {
  auth: MicrosoftSharePointAuthValue;
  sessionPath: string;
  data: Buffer;
  fileName: string;
  conflictBehavior: 'replace' | 'rename' | 'fail';
}): Promise<unknown> {
  const client = create({ auth });
  const session = await LargeFileUploadTask.createUploadSession(client, sessionPath, {
    item: { '@microsoft.graph.conflictBehavior': conflictBehavior },
  });
  const task = new LargeFileUploadTask(
    client,
    new FileUpload(data, fileName, data.length),
    session,
    { rangeSize: UPLOAD_CHUNK_SIZE }
  );
  const result = await task.upload();
  return result.responseBody;
}

function pageSize({ limit }: { limit: number | undefined }): number {
  const value = limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('Limit must be a whole number of at least 1.');
  }
  return Math.min(value, MAX_LIMIT);
}

export const microsoftSharePointClient = {
  baseUrl,
  create,
  list,
  download,
  postRaw,
  postForLocation,
  uploadLargeFile,
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const UPLOAD_CHUNK_SIZE = 32 * 320 * 1024;
