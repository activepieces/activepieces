import {
  HttpError,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.mem.ai/v2';

const MAX_POLL_PAGES = 200;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function vendorError(body: unknown): {
  message: string | undefined;
  type: string | undefined;
  resetTime: string | undefined;
} {
  if (typeof body === 'string') {
    return { message: readString(body), type: undefined, resetTime: undefined };
  }
  if (!isRecord(body)) {
    return { message: undefined, type: undefined, resetTime: undefined };
  }
  const error = isRecord(body['error']) ? body['error'] : undefined;
  const details = error && isRecord(error['details']) ? error['details'] : undefined;
  const detail = body['detail'];
  return {
    message:
      readString(error?.['message']) ??
      readString(body['message']) ??
      readString(detail) ??
      (detail === undefined ? undefined : JSON.stringify(detail)),
    type: readString(error?.['type']),
    resetTime: readString(details?.['reset_time']),
  };
}

function describeFailure({
  status,
  body,
}: {
  status: number;
  body: unknown;
}): string {
  const { message, type, resetTime } = vendorError(body);
  const suffix = message ? ` Mem said: ${message}` : '';
  if (status === 401) {
    return `Mem rejected the API key (401). Create a new key in Mem under Settings → API.${suffix}`;
  }
  if (status === 403) {
    return `Mem refused access to this resource (403). The API key is valid but lacks permission.${suffix}`;
  }
  if (status === 404) {
    return `Mem could not find the requested resource (404). Check the ID.${suffix}`;
  }
  if (status === 409) {
    return `Mem reported a conflict (409), for example a duplicate ID or a stale note version.${suffix}`;
  }
  if (status === 429 && type === 'quota_exceeded') {
    const reset = resetTime ? ` The quota resets at ${resetTime}.` : '';
    return `Your Mem plan's usage quota is exhausted (429 quota_exceeded).${reset}${suffix}`;
  }
  if (status === 429) {
    return `Mem rate limit reached (429). Wait a minute and try again.${suffix}`;
  }
  if (status >= 500) {
    return `Mem had a server error (${status}). Try again later.${suffix}`;
  }
  return `Mem request failed (${status}).${suffix}`;
}

function toQuery(
  values: Record<string, string | number | boolean | undefined>
): QueryParams {
  const query: QueryParams = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') {
      query[key] = String(value);
    }
  }
  return query;
}

function yesNoToBoolean(value: string | undefined): boolean | undefined {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return undefined;
}

function splitCollections(values: unknown[] | undefined): {
  collection_ids: string[];
  collection_titles: string[];
} {
  const collection_ids: string[] = [];
  const collection_titles: string[] = [];
  for (const raw of values ?? []) {
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value === '') continue;
    if (UUID_PATTERN.test(value)) {
      collection_ids.push(value);
    } else {
      collection_titles.push(value);
    }
  }
  return { collection_ids, collection_titles };
}

function encodePath(segments: TemplateStringsArray, ...ids: string[]): string {
  return segments.reduce(
    (path, segment, index) =>
      index < ids.length ? `${path}${segment}${encodeURIComponent(ids[index])}` : `${path}${segment}`,
    ''
  );
}

async function request<T>({
  apiKey,
  method,
  path,
  body,
  query,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: QueryParams;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      queryParams: query,
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw new MemApiError({
        status: error.response.status,
        responseBody: error.response.body,
      });
    }
    throw error;
  }
}

async function pollNotes({
  apiKey,
  timestampField,
  lastFetchEpochMS,
  collectionId,
}: {
  apiKey: string;
  timestampField: 'created_at' | 'updated_at';
  lastFetchEpochMS: number;
  collectionId: string | undefined;
}): Promise<{ epochMilliSeconds: number; data: NoteListItem }[]> {
  const filterKey = timestampField === 'created_at' ? 'filter_by_created_after' : 'filter_by_updated_after';
  const isSample = lastFetchEpochMS === 0;
  const since = isSample ? undefined : new Date(lastFetchEpochMS).toISOString();
  const seen = new Map<string, NoteListItem>();
  let page: string | undefined;
  let pagesFetched = 0;
  for (;;) {
    if (pagesFetched >= MAX_POLL_PAGES) {
      throw new Error(
        `Mem returned more than ${MAX_POLL_PAGES} pages of notes changed since ${since}. Stopped so that no notes are silently skipped; disable and re-enable the trigger to start from now.`
      );
    }
    pagesFetched++;
    const response = await request<NoteListResponse>({
      apiKey,
      method: HttpMethod.GET,
      path: '/notes',
      query: toQuery({
        order_by: timestampField,
        [filterKey]: since,
        collection_id: collectionId,
        limit: isSample ? 5 : 100,
        page,
      }),
    });
    for (const note of response.results) {
      seen.set(`${note.id}:${note[timestampField]}`, note);
    }
    if (isSample || !response.next_page) break;
    page = response.next_page;
  }
  return [...seen.values()]
    .map((note) => ({ epochMilliSeconds: Date.parse(note[timestampField]), data: note }))
    .filter((item) => Number.isFinite(item.epochMilliSeconds) && item.epochMilliSeconds > lastFetchEpochMS)
    .sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
}

class MemApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ status, responseBody }: { status: number; responseBody: unknown }) {
    super(describeFailure({ status, body: responseBody }));
    this.name = 'MemApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function collectionFields(): OutputSchemaField[] {
  return [
    { key: 'id', label: 'Collection ID' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'note_count', label: 'Note Count', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ];
}

function noteListItemFields(): OutputSchemaField[] {
  return [
    { key: 'id', label: 'Note ID' },
    { key: 'title', label: 'Title' },
    { key: 'snippet', label: 'Snippet' },
    { key: 'content', label: 'Content' },
    { key: 'collection_ids', label: 'Collection IDs' },
    { key: 'audio_recording_ids', label: 'Audio Recording IDs' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ];
}

function noteFields(): OutputSchemaField[] {
  return [
    { key: 'id', label: 'Note ID' },
    { key: 'title', label: 'Title' },
    { key: 'content', label: 'Content' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'collection_ids', label: 'Collection IDs' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'trashed_at', label: 'Trashed At', format: 'datetime' },
  ];
}

export const memClient = {
  request,
  encodePath,
  toQuery,
  yesNoToBoolean,
  splitCollections,
  describeFailure,
  pollNotes,
};

export const memSchemas = {
  requestId: {
    fields: [{ key: 'request_id', label: 'Request ID' }],
  },
  note: { fields: noteFields() },
  readNote: {
    fields: [
      ...noteFields(),
      {
        key: 'attachment_metadata',
        label: 'Attachments',
        labelKey: 'attachment_id',
        listItems: [
          { key: 'attachment_id', label: 'Attachment ID' },
          { key: 'attachment_kind', label: 'Kind' },
          { key: 'summary', label: 'Summary' },
          { key: 'ocr_text', label: 'OCR Text' },
        ],
      },
    ],
  },
  noteList: {
    fields: [
      { key: 'results', label: 'Notes', labelKey: 'title', listItems: noteListItemFields() },
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'next_page', label: 'Next Page Cursor' },
    ],
  },
  noteSearch: {
    fields: [
      { key: 'results', label: 'Notes', labelKey: 'title', listItems: noteListItemFields() },
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'offset', label: 'Offset', format: 'number' },
      { key: 'limit', label: 'Limit', format: 'number' },
      { key: 'has_next_page', label: 'Has Next Page', format: 'boolean' },
      { key: 'snapshot_id', label: 'Snapshot ID' },
    ],
  },
  relatedNotes: {
    fields: [
      {
        key: 'results',
        label: 'Related Notes',
        labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Note ID' },
          { key: 'title', label: 'Title' },
          { key: 'snippet', label: 'Snippet' },
          { key: 'preview', label: 'Preview' },
          { key: 'score', label: 'Score', format: 'number' },
          { key: 'collection_ids', label: 'Collection IDs' },
          {
            key: 'collections',
            label: 'Collections',
            labelKey: 'title',
            listItems: [
              { key: 'id', label: 'Collection ID' },
              { key: 'title', label: 'Title' },
            ],
          },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        ],
      },
      { key: 'total', label: 'Total', format: 'number' },
    ],
  },
  collection: { fields: collectionFields() },
  createdCollection: {
    fields: collectionFields().filter((field) => field.key !== 'note_count'),
  },
  memIt: {
    fields: [{ key: 'request_id', label: 'Request ID (the note appears in Mem a few seconds later)' }],
  },
  collectionList: {
    fields: [
      { key: 'results', label: 'Collections', labelKey: 'title', listItems: collectionFields() },
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'next_page', label: 'Next Page Cursor' },
    ],
  },
  collectionSearch: {
    fields: [
      { key: 'results', label: 'Collections', labelKey: 'title', listItems: collectionFields() },
      { key: 'total', label: 'Total', format: 'number' },
    ],
  },
  noteTrigger: {
    fields: noteListItemFields().filter((field) => field.key !== 'content'),
  },
} satisfies Record<string, OutputSchema>;

export { MemApiError };

export type NoteListItem = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  collection_ids?: string[];
};

export type NoteListResponse = {
  results: NoteListItem[];
  total: number;
  next_page?: string | null;
};

export type Collection = {
  id: string;
  title: string;
};

export type CollectionListResponse = {
  results: Collection[];
  total: number;
  next_page: string | null;
};

export type ReadNoteResponse = {
  id: string;
  version: number;
};
