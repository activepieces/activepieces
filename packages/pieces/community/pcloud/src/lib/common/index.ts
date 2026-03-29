import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';


function getBaseUrl(auth: OAuth2PropertyValue): string {
  const hostname =
    auth.data?.['hostname'] ?? auth.props?.['region'] ?? 'api.pcloud.com';
  return `https://${hostname}`;
}

async function sendPcloudRequest<T>(
  auth: OAuth2PropertyValue,
  method: HttpMethod,
  endpoint: string,
  queryParams?: Record<string, string | number | boolean>,
): Promise<T> {
  const baseUrl = getBaseUrl(auth);
  const url = new URL(`${baseUrl}${endpoint}`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  const response = await httpClient.sendRequest<T>({
    method,
    url: url.toString(),
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });
  const body = response.body as Record<string, unknown>;
  if (body && typeof body === 'object' && 'result' in body && body.result !== 0) {
    throw new Error(`pCloud API error ${body.result}: ${body.error}`);
  }
  return response.body;
}

async function uploadFileToPcloud(
  auth: OAuth2PropertyValue,
  folderId: number,
  fileName: string,
  fileBuffer: Buffer,
): Promise<PcloudUploadResponse> {
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), fileName);

  const response = await httpClient.sendRequest<PcloudUploadResponse>({
    method: HttpMethod.POST,
    url: `${getBaseUrl(auth)}/uploadfile?folderid=${folderId}`,
    body: formData,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });
  const body = response.body;
  if (body.result !== 0) {
    const error = (body as unknown as Record<string, unknown>).error;
    throw new Error(`pCloud upload error ${body.result}: ${error}`);
  }
  return body;
}

async function listFolder(
  auth: OAuth2PropertyValue,
  folderId: number,
  recursive: boolean,
): Promise<PcloudListFolderResponse> {
  return sendPcloudRequest<PcloudListFolderResponse>(
    auth,
    HttpMethod.GET,
    '/listfolder',
    { folderid: folderId, recursive: recursive ? 1 : 0 },
  );
}

export const pcloudCommon = {
  getBaseUrl,
  sendPcloudRequest,
  uploadFileToPcloud,
  listFolder,
};

export type PcloudMetadata = {
  name: string;
  created: string;
  modified: string;
  isfolder: boolean;
  fileid?: number;
  folderid?: number;
  path: string;
  parentfolderid: number;
  contenttype?: string;
  size?: number;
  contents?: PcloudMetadata[];
};

export type PcloudListFolderResponse = {
  result: number;
  metadata: PcloudMetadata;
};

export type PcloudUploadResponse = {
  error?: string;
  result: number;
  metadata: PcloudMetadata[];
  checksums: unknown[];
  fileids: number[];
};

export type PcloudFileLinkResponse = {
  result: number;
  dwltag: string;
  hash: number;
  size: number;
  expires: string;
  path: string;
  hosts: string[];
};

export type PcloudCopyFileResponse = {
  result: number;
  metadata: PcloudMetadata;
};

export type PcloudCreateFolderResponse = {
  result: number;
  metadata: PcloudMetadata;
};
