import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

function presentationUrl(presentationId: string): string {
  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}

function slideUrl({ presentationId, slideObjectId }: { presentationId: string; slideObjectId: string }): string {
  return `${presentationUrl(presentationId)}#slide=id.${slideObjectId}`;
}

async function slidesRequest<T>({
  accessToken,
  method,
  path,
  body,
  queryParams,
}: {
  accessToken: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${SLIDES_API_BASE}/${path}`,
    body,
    queryParams,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });
  return response.body;
}

async function getPresentation({
  accessToken,
  presentationId,
  fields,
}: {
  accessToken: string;
  presentationId: string;
  fields?: string;
}): Promise<Presentation> {
  return slidesRequest<Presentation>({
    accessToken,
    method: HttpMethod.GET,
    path: encodeURIComponent(presentationId),
    queryParams: fields ? { fields } : undefined,
  });
}

async function getPage({
  accessToken,
  presentationId,
  pageObjectId,
}: {
  accessToken: string;
  presentationId: string;
  pageObjectId: string;
}): Promise<Page> {
  return slidesRequest<Page>({
    accessToken,
    method: HttpMethod.GET,
    path: `${encodeURIComponent(presentationId)}/pages/${encodeURIComponent(pageObjectId)}`,
  });
}

async function getPageThumbnail({
  accessToken,
  presentationId,
  pageObjectId,
  thumbnailSize,
}: {
  accessToken: string;
  presentationId: string;
  pageObjectId: string;
  thumbnailSize: string;
}): Promise<Thumbnail> {
  return slidesRequest<Thumbnail>({
    accessToken,
    method: HttpMethod.GET,
    path: `${encodeURIComponent(presentationId)}/pages/${encodeURIComponent(pageObjectId)}/thumbnail`,
    queryParams: {
      'thumbnailProperties.thumbnailSize': thumbnailSize,
      'thumbnailProperties.mimeType': 'PNG',
    },
  });
}

async function batchUpdate({
  accessToken,
  presentationId,
  requests,
  requiredRevisionId,
}: {
  accessToken: string;
  presentationId: string;
  requests: unknown[];
  requiredRevisionId?: string;
}): Promise<BatchUpdateResponse> {
  return slidesRequest<BatchUpdateResponse>({
    accessToken,
    method: HttpMethod.POST,
    path: `${encodeURIComponent(presentationId)}:batchUpdate`,
    body: {
      requests,
      ...(requiredRevisionId ? { writeControl: { requiredRevisionId } } : {}),
    },
  });
}

function decodeErrorPayload(data: unknown): unknown {
  const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data;
  const text = Buffer.isBuffer(buffer) ? buffer.toString('utf8') : buffer;
  if (typeof text !== 'string') {
    return text;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function describeGoogleError(error: unknown): GoogleErrorInfo {
  if (typeof error !== 'object' || error === null) {
    return {};
  }
  const code = readField({ value: error, key: 'code' });
  const response = readField({ value: error, key: 'response' });
  const responseStatus = readField({ value: response, key: 'status' });
  const status = typeof responseStatus === 'number' ? responseStatus : typeof code === 'number' ? code : undefined;
  if (status === undefined) {
    return {};
  }
  const payload = readErrorPayload(response);
  if (typeof payload === 'string') {
    return { status, message: payload.slice(0, 500) };
  }
  const googleError = readField({ value: payload, key: 'error' });
  const message = readField({ value: googleError, key: 'message' });
  const errors = readField({ value: googleError, key: 'errors' });
  const reason = Array.isArray(errors) ? readField({ value: errors[0], key: 'reason' }) : undefined;
  return {
    status,
    message: typeof message === 'string' ? message : undefined,
    reason: typeof reason === 'string' ? reason : undefined,
  };
}

function readErrorPayload(response: unknown): unknown {
  for (const key of ['data', 'body']) {
    const decoded = decodeErrorPayload(readField({ value: response, key }));
    if (typeof decoded === 'string' || readField({ value: decoded, key: 'error' }) !== undefined) {
      return decoded;
    }
  }
  return undefined;
}

function readField({ value, key }: { value: unknown; key: string }): unknown {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined;
  }
  return Reflect.get(value, key);
}

function googleApiError({ error, action }: { error: unknown; action: string }): Error {
  const { status, message, reason } = describeGoogleError(error);
  if (status === undefined) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const detail = message ? ` Google says: ${message}` : '';
  if (reason === 'exportSizeLimitExceeded') {
    return new Error(
      `Could not ${action}: the presentation is larger than Google Drive's 10 MB export limit.${detail}`
    );
  }
  if (reason === 'storageQuotaExceeded') {
    return new Error(
      `Could not ${action}: the account has no Google Drive storage left. A service account has no storage of its own, so pick a folder in a Shared Drive it is a member of.${detail}`
    );
  }
  if (status === 400 && isRevisionMismatch(message)) {
    return new Error(
      `Could not ${action}: the presentation changed since it was read, so nothing was changed. Run the step again (for Batch Update, first get a fresh Required Revision ID from Get Presentation Outline).${detail}`
    );
  }
  switch (status) {
    case 400:
      return new Error(`Could not ${action}: Google rejected the request (400).${detail}${notFoundHint(message)}`);
    case 401:
      return new Error(
        `Could not ${action}: the Google connection is no longer valid (401). Reconnect the account.${detail}`
      );
    case 403:
      return new Error(
        `Could not ${action}: permission denied (403). Make sure the connected account (or service account) has access to this file, with edit access for changes.${detail}`
      );
    case 404:
      return new Error(
        `Could not ${action}: not found (404). Check the ID, and that the file is shared with the connected account.${detail}`
      );
    case 429:
      return new Error(`Could not ${action}: Google rate limit reached (429). Try again later.${detail}`);
    default:
      return new Error(`Could not ${action} (HTTP ${status}).${detail}`);
  }
}

function isRevisionMismatch(message: string | undefined): boolean {
  return message !== undefined && /required revision ID .* does not match the latest revision/i.test(message);
}

function notFoundHint(message: string | undefined): string {
  return message && /could not be found|not found/i.test(message)
    ? ' Check the object IDs with Get Presentation Outline or List Slide Elements.'
    : '';
}

export const SLIDES_API_BASE = 'https://slides.googleapis.com/v1/presentations';
export const PRESENTATION_MIME_TYPE = 'application/vnd.google-apps.presentation';

export const slidesApi = {
  getPresentation,
  getPage,
  getPageThumbnail,
  batchUpdate,
  presentationUrl,
  slideUrl,
  describeGoogleError,
  googleApiError,
};

type GoogleErrorInfo = { status?: number; message?: string; reason?: string };

export type Thumbnail = { width?: number; height?: number; contentUrl?: string };

export type TextElement = {
  textRun?: { content?: string };
  autoText?: { content?: string };
  paragraphMarker?: unknown;
};

export type TextContent = {
  textElements?: TextElement[];
};

export type Placeholder = {
  type?: string;
  index?: number;
  parentObjectId?: string;
};

export type TableCell = {
  text?: TextContent;
};

export type Dimension = { magnitude?: number; unit?: string };

export type Size = { width?: Dimension; height?: Dimension };

export type AffineTransform = {
  scaleX?: number;
  scaleY?: number;
  shearX?: number;
  shearY?: number;
  translateX?: number;
  translateY?: number;
  unit?: string;
};

export type PageElement = {
  objectId: string;
  size?: Size;
  transform?: AffineTransform;
  shape?: { shapeType?: string; text?: TextContent; placeholder?: Placeholder };
  table?: {
    rows?: number;
    columns?: number;
    tableColumns?: { columnWidth?: Dimension }[];
    tableRows?: { rowHeight?: Dimension; tableCells?: TableCell[] }[];
  };
  elementGroup?: { children?: PageElement[] };
  sheetsChart?: { spreadsheetId?: string; chartId?: number };
  image?: { contentUrl?: string; sourceUrl?: string };
  video?: { source?: string; id?: string; url?: string };
  line?: unknown;
  wordArt?: { renderedText?: string };
};

export type NotesPage = {
  objectId?: string;
  notesProperties?: { speakerNotesObjectId?: string };
  pageElements?: PageElement[];
};

export type Page = {
  objectId: string;
  pageType?: string;
  pageElements?: PageElement[];
  slideProperties?: {
    layoutObjectId?: string;
    masterObjectId?: string;
    isSkipped?: boolean;
    notesPage?: NotesPage;
  };
  layoutProperties?: {
    name?: string;
    displayName?: string;
    masterObjectId?: string;
  };
};

export type Presentation = {
  presentationId: string;
  title?: string;
  revisionId?: string;
  locale?: string;
  pageSize?: Size;
  slides?: Page[];
  layouts?: Page[];
  masters?: Page[];
};

export type BatchUpdateResponse = {
  presentationId: string;
  replies?: Record<string, unknown>[];
  writeControl?: { requiredRevisionId?: string };
};
