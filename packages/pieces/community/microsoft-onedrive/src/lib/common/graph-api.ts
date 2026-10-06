import {
  AuthenticationType,
  HttpError,
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from './microsoft-cloud';

export const oneDriveApi = {
  request,
  itemPath,
  folderPath,
  getRootId,
  resolveFolderId,
  getDriveId,
  toItem,
  describeError,
  statusOf,
};

export class OneDriveApiError extends Error {
  readonly status: number | null;

  constructor({ message, status }: { message: string; status: number | null }) {
    super(message);
    this.name = 'OneDriveApiError';
    this.status = status;
  }
}

async function request<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
  headers,
}: GraphRequest): Promise<T> {
  const url = resolveUrl({ auth, path });
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url,
      body,
      queryParams,
      headers,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });
    return response.body;
  } catch (error) {
    throw new OneDriveApiError({
      message: describeError(error),
      status: error instanceof HttpError ? error.response.status : null,
    });
  }
}

function resolveUrl({ auth, path }: { auth: OAuth2PropertyValue; path: string }): string {
  const base = graphBaseUrl(auth);
  if (!/^[a-z][a-z0-9+.-]*:/i.test(path)) {
    return `${base}${path}`;
  }
  if (!path.startsWith(`${base}/`)) {
    throw new OneDriveApiError({
      message: 'The page token or link is not a Microsoft Graph URL for this connection. Pass the token returned by the previous call unchanged.',
      status: null,
    });
  }
  return path;
}

function statusOf(error: unknown): number | null {
  return error instanceof OneDriveApiError ? error.status : null;
}

function graphBaseUrl(auth: OAuth2PropertyValue): string {
  const cloud = auth.props?.['cloud'];
  return `${getGraphBaseUrl(typeof cloud === 'string' ? cloud : undefined)}/v1.0`;
}

function itemPath({ itemId, path }: { itemId?: string; path?: string }): string {
  const trimmedId = itemId?.trim();
  if (trimmedId) {
    return trimmedId === 'root' ? '/me/drive/root' : `/me/drive/items/${encodeURIComponent(trimmedId)}`;
  }
  const trimmedPath = path?.trim().replace(/^\/+|\/+$/g, '');
  if (trimmedPath) {
    return `/me/drive/root:/${trimmedPath.split('/').map(encodeURIComponent).join('/')}:`;
  }
  throw new Error('Provide either an item ID or a path.');
}

function folderPath({ folderId }: { folderId?: string }): string {
  return itemPath({ itemId: folderId?.trim() ? folderId : 'root' });
}

async function getRootId({ auth }: { auth: OAuth2PropertyValue }): Promise<string> {
  const root = await request<{ id: string }>({
    auth,
    method: HttpMethod.GET,
    path: '/me/drive/root',
    queryParams: { $select: 'id' },
  });
  return root.id;
}

async function resolveFolderId({ auth, folderId }: { auth: OAuth2PropertyValue; folderId?: string }): Promise<string> {
  const trimmed = folderId?.trim();
  if (!trimmed || trimmed === 'root') {
    return getRootId({ auth });
  }
  return trimmed;
}

async function getDriveId({ auth }: { auth: OAuth2PropertyValue }): Promise<string> {
  const drive = await request<{ id: string }>({
    auth,
    method: HttpMethod.GET,
    path: '/me/drive',
    queryParams: { $select: 'id' },
  });
  return drive.id;
}

function toItem(item: GraphDriveItem): OneDriveItem {
  return {
    id: item.id,
    name: item.name,
    type: item.folder ? 'folder' : item.package ? 'package' : item.remoteItem ? 'remote' : 'file',
    mimeType: item.file?.mimeType ?? null,
    size: item.size ?? null,
    webUrl: item.webUrl ?? null,
    createdDateTime: item.createdDateTime ?? null,
    lastModifiedDateTime: item.lastModifiedDateTime ?? null,
    childCount: item.folder?.childCount ?? null,
    parentId: item.parentReference?.id ?? null,
    parentPath: item.parentReference?.path ?? null,
    driveId: item.parentReference?.driveId ?? null,
    driveType: item.parentReference?.driveType ?? null,
    createdByName: item.createdBy?.user?.displayName ?? null,
    createdByEmail: item.createdBy?.user?.email ?? null,
    lastModifiedByName: item.lastModifiedBy?.user?.displayName ?? null,
    lastModifiedByEmail: item.lastModifiedBy?.user?.email ?? null,
    description: item.description ?? null,
    deleted: item.deleted !== undefined,
    remoteItemId: item.remoteItem?.id ?? null,
    remoteDriveId: item.remoteItem?.parentReference?.driveId ?? null,
  };
}

function describeError(error: unknown): string {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error.message : String(error);
  }
  const status = error.response.status;
  const graphError = readGraphError(error.response.body);
  const detail = graphError ? ` (${graphError})` : '';
  switch (status) {
    case 400:
      return `OneDrive rejected the request${detail}.`;
    case 401:
      return `The OneDrive connection is no longer valid. Reconnect the account${detail}.`;
    case 403:
      return `Access denied. The connection lacks permission for this item or operation, or the account type does not support it${detail}.`;
    case 404:
      return `The item was not found. Check the ID or path${detail}.`;
    case 409:
      return `An item with that name already exists, or the item is in a conflicting state${detail}.`;
    case 410:
      return `The token or resource has expired and must be requested again${detail}.`;
    case 423:
      return `The item is locked, for example checked out by another user${detail}.`;
    case 429:
      return `OneDrive rate limit reached. Retry later${detail}.`;
    default:
      return `OneDrive request failed with status ${status}${detail}.`;
  }
}

function readGraphError(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return null;
  }
  const inner = body.error;
  if (typeof inner !== 'object' || inner === null) {
    return null;
  }
  const code = 'code' in inner && typeof inner.code === 'string' ? inner.code : null;
  const message = 'message' in inner && typeof inner.message === 'string' ? inner.message : null;
  return [code, message].filter(Boolean).join(': ') || null;
}

export type GraphRequest = {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
  headers?: Record<string, string>;
};

export type GraphIdentity = {
  user?: { displayName?: string; email?: string; id?: string };
  application?: { displayName?: string; id?: string };
};

export type GraphDriveItem = {
  id: string;
  name: string;
  size?: number;
  webUrl?: string;
  description?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  createdBy?: GraphIdentity;
  lastModifiedBy?: GraphIdentity;
  parentReference?: { id?: string; path?: string; driveId?: string; driveType?: string; name?: string };
  file?: { mimeType?: string };
  folder?: { childCount?: number };
  package?: { type?: string };
  deleted?: { state?: string };
  remoteItem?: { id?: string; parentReference?: { driveId?: string } };
  '@microsoft.graph.downloadUrl'?: string;
};

export type OneDriveItem = {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'package' | 'remote';
  mimeType: string | null;
  size: number | null;
  webUrl: string | null;
  createdDateTime: string | null;
  lastModifiedDateTime: string | null;
  childCount: number | null;
  parentId: string | null;
  parentPath: string | null;
  driveId: string | null;
  driveType: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  lastModifiedByName: string | null;
  lastModifiedByEmail: string | null;
  description: string | null;
  deleted: boolean;
  remoteItemId: string | null;
  remoteDriveId: string | null;
};
