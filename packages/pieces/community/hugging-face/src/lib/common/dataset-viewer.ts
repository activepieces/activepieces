import { AuthenticationType, httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { hfHub, QueryEntry } from './hub-client';
import { hfRepo } from './repo';
import { hfUtils } from './utils';

async function resolveDataset({ token, dataset }: ResolveDatasetParams): Promise<string> {
  return hfRepo.resolveRepoId({ token, repoType: 'dataset', repoId: dataset });
}

function buildViewerUrl({ path, query }: BuildViewerUrlParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of query) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    search.append(key, String(value));
  }
  return `${VIEWER_BASE_URL}${path}?${search.toString()}`;
}

function extractViewerDetail(body: unknown): string | null {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.length === 0 || trimmed.startsWith('<')) {
      return null;
    }
    return trimmed.slice(0, 500);
  }
  if (hfHub.isRecord(body) && typeof body['error'] === 'string') {
    return body['error'];
  }
  return null;
}

function toViewerError({ error, path, dataset }: ToViewerErrorParams): Error {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const status = error.response.status;
  const detail = extractViewerDetail(error.response.body);
  const suffix = detail ? ` Details: ${detail}` : '';
  const resource = `${path} for dataset '${dataset}'`;
  switch (status) {
    case 400:
    case 422:
      return new Error(`The dataset viewer rejected the request (${status}) to ${resource}.${suffix}`);
    case 401:
    case 403:
      return new Error(
        `The dataset viewer cannot access '${dataset}' (${status}). The dataset does not exist, or it is private or gated for this token. Private datasets are served only when owned by a PRO user or an Enterprise organization, and gated datasets need a token whose account has been granted access.${suffix}`
      );
    case 404:
      return new Error(
        `Not found (404): ${resource}. Check the subset (config) and split names with List Dataset Subsets & Splits; a renamed dataset must be called with its current 'namespace/name' ID.${suffix}`
      );
    case 429:
      return hfHub.toError({ error, resource });
    case 500:
    case 501:
    case 502:
    case 503:
      return new Error(
        `The dataset viewer cannot serve ${resource} right now (${status}). The result may still be computing, or this capability is not supported for the dataset. Call Check Dataset Viewer Support, and retry later if the capability is available.${suffix}`
      );
    default:
      return new Error(`Dataset viewer request failed (${status}) for ${resource}.${suffix}`);
  }
}

async function viewerRequest<T>({ token, path, dataset, query }: ViewerRequestParams): Promise<T> {
  const datasetId = await resolveDataset({ token, dataset });
  const url = buildViewerUrl({ path, query: [['dataset', datasetId], ...(query ?? [])] });
  const hasToken = token.trim().length > 0;
  try {
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod.GET,
      url,
      authentication: hasToken ? { type: AuthenticationType.BEARER_TOKEN, token } : undefined,
    });
    return response.body;
  } catch (error) {
    throw toViewerError({ error, path, dataset: datasetId });
  }
}

function validatePaging({ offset, length }: PagingInput): PagingValues {
  hfUtils.assertLimit({ value: offset, min: 0, max: Number.MAX_SAFE_INTEGER, name: 'Offset' });
  hfUtils.assertLimit({ value: length, min: 1, max: MAX_ROWS_PER_CALL, name: 'Length' });
  return { offset: offset ?? 0, length: length ?? DEFAULT_ROWS_PER_CALL };
}

function withPaging({ body, offset }: WithPagingParams): Record<string, unknown> {
  const record = hfHub.isRecord(body) ? body : {};
  const rows = Array.isArray(record['rows']) ? record['rows'] : [];
  const total = typeof record['num_rows_total'] === 'number' ? record['num_rows_total'] : null;
  const nextOffset = offset + rows.length;
  const hasMore = rows.length > 0 && (total === null || nextOffset < total);
  return {
    ...record,
    rows,
    num_rows_total: total,
    partial: record['partial'] === true,
    offset,
    count: rows.length,
    next_offset: hasMore ? nextOffset : null,
  };
}

function datasetProp() {
  return Property.ShortText({
    displayName: 'Dataset ID',
    description:
      "The dataset ID in 'namespace/name' form, for example 'stanfordnlp/imdb'. Find it with Search Datasets.",
    required: true,
  });
}

function configProp() {
  return Property.ShortText({
    displayName: 'Subset (Config)',
    description:
      "The subset (config) name, for example 'plain_text' or 'default'. List valid names with List Dataset Subsets & Splits.",
    required: true,
  });
}

function optionalConfigProp() {
  return Property.ShortText({
    displayName: 'Subset (Config)',
    description:
      "Optional subset (config) name, for example 'plain_text'. Leave empty to cover every subset. List valid names with List Dataset Subsets & Splits.",
    required: false,
  });
}

function splitProp() {
  return Property.ShortText({
    displayName: 'Split',
    description:
      "The split name, for example 'train', 'test' or 'validation'. List valid names with List Dataset Subsets & Splits.",
    required: true,
  });
}

function optionalSplitProp() {
  return Property.ShortText({
    displayName: 'Split',
    description: "Optional split name, for example 'train'. Only used together with a subset (config).",
    required: false,
  });
}

function offsetProp() {
  return Property.Number({
    displayName: 'Offset',
    description: 'Zero-based index of the first row to return. Use 0 for the first page, then the returned next_offset value.',
    required: false,
    defaultValue: 0,
  });
}

function lengthProp() {
  return Property.Number({
    displayName: 'Length',
    description: `Number of rows to return in this page (1 to ${MAX_ROWS_PER_CALL}).`,
    required: false,
    defaultValue: DEFAULT_ROWS_PER_CALL,
  });
}

const VIEWER_BASE_URL = 'https://datasets-server.huggingface.co';
const MAX_ROWS_PER_CALL = 100;
const DEFAULT_ROWS_PER_CALL = 20;

export const hfViewer = {
  baseUrl: VIEWER_BASE_URL,
  maxRowsPerCall: MAX_ROWS_PER_CALL,
  request: viewerRequest,
  resolveDataset,
  toError: toViewerError,
  validatePaging,
  withPaging,
};

export const hfViewerProps = {
  dataset: datasetProp,
  config: configProp,
  optionalConfig: optionalConfigProp,
  split: splitProp,
  optionalSplit: optionalSplitProp,
  offset: offsetProp,
  length: lengthProp,
};

type ResolveDatasetParams = {
  token: string;
  dataset: string;
};

type BuildViewerUrlParams = {
  path: string;
  query: QueryEntry[];
};

type ToViewerErrorParams = {
  error: unknown;
  path: string;
  dataset: string;
};

type ViewerRequestParams = {
  token: string;
  path: string;
  dataset: string;
  query?: QueryEntry[];
};

type PagingInput = {
  offset: number | undefined;
  length: number | undefined;
};

type PagingValues = {
  offset: number;
  length: number;
};

type WithPagingParams = {
  body: unknown;
  offset: number;
};
