import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import {
  AuthResponse,
  CreateSignatureRequest,
  CreateSignatureResponse,
  ILoveApiTool,
  ProcessFile,
  ProcessRequest,
  ProcessResponse,
  StartTaskResponse,
  UploadResponse,
} from './types';

const ROOT_API = 'https://api.ilovepdf.com';

async function authenticate({ publicKey }: { publicKey: string }): Promise<string> {
  const response = await httpClient.sendRequest<AuthResponse>({
    method: HttpMethod.POST,
    url: `${ROOT_API}/v1/auth`,
    body: { public_key: publicKey },
  });
  return response.body.token;
}

async function startTask({
  token,
  tool,
}: {
  token: string;
  tool: ILoveApiTool;
}): Promise<StartTaskResponse> {
  const response = await httpClient.sendRequest<StartTaskResponse>({
    method: HttpMethod.GET,
    url: `${ROOT_API}/v1/start/${tool}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
  });
  return response.body;
}

async function uploadBuffer({
  token,
  server,
  task,
  buffer,
  filename,
}: {
  token: string;
  server: string;
  task: string;
  buffer: Buffer;
  filename: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append('task', task);
  formData.append('file', buffer, filename);

  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `https://${server}/v1/upload`,
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  };
  const response = await httpClient.sendRequest<UploadResponse>(request);
  return response.body.server_filename;
}

async function uploadCloudUrl({
  token,
  server,
  task,
  url,
}: {
  token: string;
  server: string;
  task: string;
  url: string;
}): Promise<string> {
  const response = await httpClient.sendRequest<UploadResponse>({
    method: HttpMethod.POST,
    url: `https://${server}/v1/upload`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    body: { task, cloud_file: url },
  });
  return response.body.server_filename;
}

async function processTask({
  token,
  server,
  body,
}: {
  token: string;
  server: string;
  body: ProcessRequest;
}): Promise<ProcessResponse> {
  const response = await httpClient.sendRequest<ProcessResponse>({
    method: HttpMethod.POST,
    url: `https://${server}/v1/process`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    body,
  });
  return response.body;
}

async function downloadResult({
  token,
  server,
  task,
}: {
  token: string;
  server: string;
  task: string;
}): Promise<Buffer> {
  const response = await httpClient.sendRequest<ArrayBuffer | string>({
    method: HttpMethod.GET,
    url: `https://${server}/v1/download/${task}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    responseType: 'arraybuffer',
  });
  if (typeof response.body === 'string') {
    return Buffer.from(response.body, 'binary');
  }
  return Buffer.from(response.body as ArrayBuffer);
}

async function createSignature({
  token,
  server,
  body,
}: {
  token: string;
  server: string;
  body: CreateSignatureRequest;
}): Promise<CreateSignatureResponse> {
  const response = await httpClient.sendRequest<CreateSignatureResponse>({
    method: HttpMethod.POST,
    url: `https://${server}/v1/signature`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    body,
  });
  return response.body;
}

async function getSignatureStatus({
  token,
  tokenRequester,
}: {
  token: string;
  tokenRequester: string;
}): Promise<Record<string, unknown>> {
  const response = await httpClient.sendRequest<Record<string, unknown>>({
    method: HttpMethod.GET,
    url: `${ROOT_API}/v1/signature/requesterview/${tokenRequester}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
  });
  return response.body;
}

async function sendSignerReminder({
  token,
  tokenRequester,
}: {
  token: string;
  tokenRequester: string;
}): Promise<Record<string, unknown>> {
  const response = await httpClient.sendRequest<Record<string, unknown>>({
    method: HttpMethod.POST,
    url: `${ROOT_API}/v1/signature/sendReminder/${tokenRequester}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
  });
  return response.body;
}

async function voidSignature({
  token,
  tokenRequester,
}: {
  token: string;
  tokenRequester: string;
}): Promise<Record<string, unknown>> {
  const response = await httpClient.sendRequest<Record<string, unknown>>({
    method: HttpMethod.POST,
    url: `${ROOT_API}/v1/signature/void/${tokenRequester}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
  });
  return response.body;
}

async function increaseExpirationDays({
  token,
  tokenRequester,
  days,
}: {
  token: string;
  tokenRequester: string;
  days: number;
}): Promise<Record<string, unknown>> {
  const response = await httpClient.sendRequest<Record<string, unknown>>({
    method: HttpMethod.POST,
    url: `${ROOT_API}/v1/signature/increase-expiration-days/${tokenRequester}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    body: { days },
  });
  return response.body;
}

async function downloadSignedFiles({
  token,
  tokenRequester,
}: {
  token: string;
  tokenRequester: string;
}): Promise<Buffer> {
  const response = await httpClient.sendRequest<ArrayBuffer | string>({
    method: HttpMethod.GET,
    url: `${ROOT_API}/v1/signature/${tokenRequester}/download-signed`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    responseType: 'arraybuffer',
  });
  if (typeof response.body === 'string') {
    return Buffer.from(response.body, 'binary');
  }
  return Buffer.from(response.body as ArrayBuffer);
}

async function downloadAuditTrail({
  token,
  tokenRequester,
}: {
  token: string;
  tokenRequester: string;
}): Promise<Buffer> {
  const response = await httpClient.sendRequest<ArrayBuffer | string>({
    method: HttpMethod.GET,
    url: `${ROOT_API}/v1/signature/${tokenRequester}/download-audit`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    responseType: 'arraybuffer',
  });
  if (typeof response.body === 'string') {
    return Buffer.from(response.body, 'binary');
  }
  return Buffer.from(response.body as ArrayBuffer);
}

export const iLoveApiClient = {
  authenticate,
  startTask,
  uploadBuffer,
  uploadCloudUrl,
  processTask,
  downloadResult,
  createSignature,
  getSignatureStatus,
  sendSignerReminder,
  voidSignature,
  increaseExpirationDays,
  downloadSignedFiles,
  downloadAuditTrail,
};

export type UploadInput =
  | { kind: 'file'; file: { base64: string; filename: string } }
  | { kind: 'url'; url: string; filename?: string };

export type RunTaskInput = {
  publicKey: string;
  tool: ILoveApiTool;
  uploads: UploadInput[];
  options?:
    | Record<string, unknown>
    | ((extraServerFilenames: string[]) => Record<string, unknown>);
  output_filename?: string;
  packaged_filename?: string;
  perFileOverrides?: Array<Partial<Pick<ProcessFile, 'rotate' | 'password'>>>;
  extraUploads?: UploadInput[];
};

export type RunTaskResult = {
  buffer: Buffer;
  downloadFilename: string;
  process: ProcessResponse;
  uploadedExtraFilenames: string[];
};

async function runTask({
  publicKey,
  tool,
  uploads,
  options,
  output_filename,
  packaged_filename,
  perFileOverrides,
  extraUploads,
}: RunTaskInput): Promise<RunTaskResult> {
  if (!uploads || uploads.length === 0) {
    throw new Error('At least one input file or URL is required');
  }

  const token = await iLoveApiClient.authenticate({ publicKey });
  const { server, task } = await iLoveApiClient.startTask({ token, tool });

  const files: ProcessFile[] = [];
  for (let i = 0; i < uploads.length; i++) {
    const upload = uploads[i];
    if (upload.kind === 'file') {
      const buffer = Buffer.from(upload.file.base64, 'base64');
      const serverFilename = await iLoveApiClient.uploadBuffer({
        token,
        server,
        task,
        buffer,
        filename: upload.file.filename,
      });
      files.push({
        server_filename: serverFilename,
        filename: upload.file.filename,
        ...perFileOverrides?.[i],
      });
    } else {
      const serverFilename = await iLoveApiClient.uploadCloudUrl({
        token,
        server,
        task,
        url: upload.url,
      });
      files.push({
        server_filename: serverFilename,
        filename: upload.filename ?? deriveFilenameFromUrl(upload.url),
        ...perFileOverrides?.[i],
      });
    }
  }

  const uploadedExtraFilenames: string[] = [];
  if (extraUploads && extraUploads.length > 0) {
    for (const extra of extraUploads) {
      if (extra.kind === 'file') {
        const buffer = Buffer.from(extra.file.base64, 'base64');
        const serverFilename = await iLoveApiClient.uploadBuffer({
          token,
          server,
          task,
          buffer,
          filename: extra.file.filename,
        });
        uploadedExtraFilenames.push(serverFilename);
      } else {
        const serverFilename = await iLoveApiClient.uploadCloudUrl({
          token,
          server,
          task,
          url: extra.url,
        });
        uploadedExtraFilenames.push(serverFilename);
      }
    }
  }

  const resolvedOptions =
    typeof options === 'function' ? options(uploadedExtraFilenames) : options ?? {};

  const processBody: ProcessRequest = {
    task,
    tool,
    files,
    ...(output_filename ? { output_filename } : {}),
    ...(packaged_filename ? { packaged_filename } : {}),
    ...resolvedOptions,
  };

  const processResponse = await iLoveApiClient.processTask({
    token,
    server,
    body: processBody,
  });

  const buffer = await iLoveApiClient.downloadResult({ token, server, task });

  return {
    buffer,
    downloadFilename: processResponse.download_filename,
    process: processResponse,
    uploadedExtraFilenames,
  };
}

function deriveFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    if (last && last.length > 0) return last;
  } catch {
    // fall through
  }
  return 'remote-file';
}

export const iLoveApi = {
  ...iLoveApiClient,
  runTask,
};
