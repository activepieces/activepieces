import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

function getBaseUrl(auth: OAuth2PropertyValue): string {
  const locationId = (auth as Record<string, unknown>)['locationid'];
  if (locationId === 2) {
    return 'https://eapi.pcloud.com';
  }
  return 'https://api.pcloud.com';
}

async function pcloudRequest<T>(
  auth: OAuth2PropertyValue,
  method: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const baseUrl = getBaseUrl(auth);
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.set(key, String(value));
    }
  }
  const url = `${baseUrl}/${method}?${queryParams.toString()}`;
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });
  return response.body;
}

async function pcloudUpload(
  auth: OAuth2PropertyValue,
  folderId: number,
  fileName: string,
  fileData: Buffer,
): Promise<PcloudUploadResponse> {
  const baseUrl = getBaseUrl(auth);
  const url = `${baseUrl}/uploadfile?folderid=${folderId}&filename=${encodeURIComponent(fileName)}`;
  const response = await httpClient.sendRequest<PcloudUploadResponse>({
    method: HttpMethod.PUT,
    url,
    body: fileData,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });
  return response.body;
}

type PcloudMetadata = {
  name: string;
  created: string;
  modified: string;
  isfolder: boolean;
  fileid?: number;
  folderid?: number;
  size?: number;
  contenttype?: string;
  path?: string;
  parentfolderid?: number;
  contents?: PcloudMetadata[];
};

type PcloudListFolderResponse = {
  result: number;
  metadata: PcloudMetadata;
};

type PcloudUploadResponse = {
  result: number;
  metadata: PcloudMetadata[];
  checksums: unknown[];
  fileids: number[];
};

type PcloudCreateFolderResponse = {
  result: number;
  metadata: PcloudMetadata;
};

type PcloudCopyFileResponse = {
  result: number;
  metadata: PcloudMetadata;
};

type PcloudFileLink = {
  result: number;
  dwltag: string;
  hash: number;
  size: number;
  path: string;
  hosts: string[];
};

export const common = {
  getBaseUrl,
  pcloudRequest,
  pcloudUpload,
};

export type {
  PcloudMetadata,
  PcloudListFolderResponse,
  PcloudUploadResponse,
  PcloudCreateFolderResponse,
  PcloudCopyFileResponse,
  PcloudFileLink,
};
