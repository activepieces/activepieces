import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const bannerbearClient = {
  getVersion(apiKey: string): BannerbearApiVersion {
    return apiKey.trim().startsWith(V5_KEY_PREFIX) ? 'v5' : 'v2';
  },
  templatePath({ apiKey, uid }: { apiKey: string; uid: string }): string {
    const base =
      bannerbearClient.getVersion(apiKey) === 'v5'
        ? '/image_templates'
        : '/templates';
    return `${base}/${encodeURIComponent(uid)}`;
  },
  getBaseUrl(apiKey: string): string {
    return `https://api.bannerbear.com/${bannerbearClient.getVersion(apiKey)}`;
  },
  async request<T>({
    apiKey,
    method,
    path,
    body,
    queryParams,
  }: {
    apiKey: string;
    method: HttpMethod;
    path: string;
    body?: unknown;
    queryParams?: QueryParams;
  }): Promise<T> {
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url: `${bannerbearClient.getBaseUrl(apiKey)}${path}`,
        body,
        queryParams,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: apiKey.trim(),
        },
      });
      return response.body;
    } catch (error) {
      throw new Error(describeError(error));
    }
  },
  requireVersion({
    apiKey,
    version,
    feature,
  }: {
    apiKey: string;
    version: BannerbearApiVersion;
    feature: string;
  }): void {
    const current = bannerbearClient.getVersion(apiKey);
    if (current !== version) {
      throw new Error(
        `${feature} is not available with ${current.toUpperCase()} API keys. Bannerbear only offers it on the ${version.toUpperCase()} API.`
      );
    }
  },
  async waitFor<T extends { status?: string | null }>({
    fetchLatest,
    initial,
    wait,
    doneStatuses,
    failedStatuses,
  }: {
    fetchLatest: () => Promise<T>;
    initial: T;
    wait: boolean;
    doneStatuses: string[];
    failedStatuses: string[];
  }): Promise<{ record: T; timedOut: boolean }> {
    let record = initial;
    if (!wait) {
      return { record, timedOut: false };
    }
    const deadline = Date.now() + MAX_WAIT_MS;
    while (
      !isFinished({ status: record.status, doneStatuses, failedStatuses })
    ) {
      if (Date.now() + POLL_INTERVAL_MS > deadline) {
        return { record, timedOut: true };
      }
      await sleep(POLL_INTERVAL_MS);
      record = await fetchLatest();
    }
    return { record, timedOut: false };
  },
  async listAllTemplates(apiKey: string): Promise<NormalizedTemplate[]> {
    const version = bannerbearClient.getVersion(apiKey);
    const path = version === 'v5' ? '/image_templates' : '/templates';
    const pageSize =
      version === 'v5' ? V5_TEMPLATE_PAGE_SIZE : bannerbearClient.MAX_LIMIT;
    const templates: NormalizedTemplate[] = [];
    for (let page = 1; ; page++) {
      if (page > MAX_TEMPLATE_PAGES) {
        throw new Error(
          `This Bannerbear account has more than ${MAX_TEMPLATE_PAGES * pageSize} templates, which is more than can be listed in one step. Use Get Template with a template UID instead.`
        );
      }
      const queryParams: QueryParams = { page: String(page) };
      if (version === 'v2') {
        queryParams['limit'] = String(bannerbearClient.MAX_LIMIT);
      }
      const batch = await bannerbearClient.request<RawTemplate[]>({
        apiKey,
        method: HttpMethod.GET,
        path,
        queryParams,
      });
      templates.push(...batch.map((t) => normalizeTemplate(t)));
      if (batch.length < pageSize) {
        break;
      }
    }
    return templates;
  },
  normalizeImage,
  normalizeTemplate,
  readTemplateUid,
  buildImageRequest,
  createImageAndWait,
  throwIfFailed,
  parseModificationsJson,
  clampLimit,
  clampPage,
  MAX_LIMIT: 100,
  IMAGE_DONE_STATUSES: ['completed'],
  IMAGE_FAILED_STATUSES: ['failed'],
};

const V5_KEY_PREFIX = 'bb_ak_v5_';
const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 120000;

const MAX_TEMPLATE_PAGES = 400;
const V5_TEMPLATE_PAGE_SIZE = 25;

function normalizeImage(raw: RawImage): NormalizedImage {
  const files = raw.files ?? {};
  const png = raw.image_url_png ?? files['png'] ?? null;
  const jpg = raw.image_url_jpg ?? files['jpg'] ?? null;
  const pdf = raw.pdf_url ?? files['pdf'] ?? null;
  const firstFile = Object.values(files).find((f) => typeof f === 'string');
  return {
    uid: raw.uid,
    status: raw.status ?? null,
    template_uid: readTemplateUid(raw.template),
    image_url: raw.image_url ?? png ?? jpg ?? firstFile ?? null,
    image_url_png: png,
    image_url_jpg: jpg,
    pdf_url: pdf,
    metadata: raw.metadata ?? null,
    error: raw.error ?? null,
    self: raw.self ?? null,
    created_at: raw.created_at ?? null,
    completed_at: raw.completed_at ?? null,
  };
}

function normalizeTemplate(raw: RawTemplate): NormalizedTemplate {
  const v5Layers = raw.config?.objects ?? [];
  const v2Layers = raw.available_modifications ?? [];
  const layers: NormalizedLayer[] =
    v5Layers.length > 0
      ? v5Layers.map((layer) => ({
          name: layer.name ?? null,
          id: layer.id ?? null,
          type: layer.type ?? 'unknown',
        }))
      : v2Layers.map((layer) => ({
          name: layer.name,
          id: null,
          type: detectV2LayerType(layer),
        }));
  return {
    uid: raw.uid,
    name: raw.name ?? null,
    width: raw.width ?? null,
    height: raw.height ?? null,
    preview_url: raw.preview_url ?? raw.preview ?? null,
    tags: raw.tags ?? [],
    created_at: raw.created_at ?? null,
    layers,
  };
}

function readTemplateUid(template: unknown): string | null {
  if (typeof template === 'string') {
    return template;
  }
  if (
    template !== null &&
    typeof template === 'object' &&
    'uid' in template &&
    typeof template.uid === 'string'
  ) {
    return template.uid;
  }
  return null;
}

function toV5Object(mod: V2Modification): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(mod)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    const mapped = V2_TO_V5_KEYS[key];
    if (mapped) {
      result[mapped] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function buildImageRequest({
  apiKey,
  templateUid,
  modifications,
  transparent,
  renderPdf,
  metadata,
  templateVersion,
}: {
  apiKey: string;
  templateUid: string;
  modifications: V2Modification[];
  transparent?: boolean;
  renderPdf?: boolean;
  metadata?: string;
  templateVersion?: number;
}): Record<string, unknown> {
  if (bannerbearClient.getVersion(apiKey) === 'v5') {
    const formats = ['png'];
    if (renderPdf) {
      formats.push('pdf');
    }
    const body: Record<string, unknown> = {
      template: templateUid,
      modifications: {
        objects: modifications.map((m) => toV5Object(m)),
        template: transparent ? { transparent: true } : undefined,
      },
      formats,
    };
    if (metadata) body['metadata'] = metadata;
    if (templateVersion !== undefined) body['version'] = templateVersion;
    return body;
  }
  const body: Record<string, unknown> = {
    template: templateUid,
    modifications,
  };
  if (transparent !== undefined) body['transparent'] = transparent;
  if (renderPdf !== undefined) body['render_pdf'] = renderPdf;
  if (metadata) body['metadata'] = metadata;
  if (templateVersion !== undefined) body['template_version'] = templateVersion;
  return body;
}

async function createImageAndWait({
  apiKey,
  body,
  wait,
}: {
  apiKey: string;
  body: Record<string, unknown>;
  wait: boolean;
}): Promise<NormalizedImage & { timed_out: boolean }> {
  const created = await bannerbearClient.request<RawImage>({
    apiKey,
    method: HttpMethod.POST,
    path: '/images',
    body,
  });
  const { record, timedOut } = await bannerbearClient.waitFor({
    initial: created,
    wait,
    doneStatuses: bannerbearClient.IMAGE_DONE_STATUSES,
    failedStatuses: bannerbearClient.IMAGE_FAILED_STATUSES,
    fetchLatest: () =>
      bannerbearClient.request<RawImage>({
        apiKey,
        method: HttpMethod.GET,
        path: `/images/${encodeURIComponent(created.uid)}`,
      }),
  });
  throwIfFailed({
    status: record.status,
    error: record.error,
    uid: record.uid,
  });
  return { ...normalizeImage(record), timed_out: timedOut };
}

function throwIfFailed({
  status,
  error,
  uid,
}: {
  status?: string | null;
  error?: string | null;
  uid: string;
}): void {
  if (status === 'failed') {
    throw new Error(
      `Bannerbear render ${uid} failed${error ? `: ${error}` : '.'}`
    );
  }
}

function parseModificationsJson(value: unknown): V2Modification[] {
  const parsed = typeof value === 'string' ? safeJsonParse(value) : value;
  if (!Array.isArray(parsed)) {
    throw new Error(
      'Modifications must be a JSON array of objects, e.g. [{"name":"title","text":"Hi"}].'
    );
  }
  return parsed.map((item, index) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Modification #${index + 1} must be an object.`);
    }
    const entries: Record<string, unknown> = Object.fromEntries(
      Object.entries(item)
    );
    const name = entries['name'];
    const id = entries['id'];
    if (
      (typeof name !== 'string' || name.trim() === '') &&
      (typeof id !== 'string' || id.trim() === '')
    ) {
      throw new Error(
        `Modification #${index + 1} needs a "name" (the layer name).`
      );
    }
    return entries;
  });
}

function clampLimit(limit: unknown): number {
  const n = Number(limit ?? 25);
  if (!Number.isFinite(n) || n < 1) return 25;
  return Math.min(Math.floor(n), bannerbearClient.MAX_LIMIT);
}

function clampPage(page: unknown): number {
  const n = Number(page ?? 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Modifications is not valid JSON.');
  }
}

function isFinished({
  status,
  doneStatuses,
  failedStatuses,
}: {
  status?: string | null;
  doneStatuses: string[];
  failedStatuses: string[];
}): boolean {
  if (!status) return true;
  return doneStatuses.includes(status) || failedStatuses.includes(status);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function detectV2LayerType(layer: Record<string, unknown>): string {
  if ('text' in layer) return 'text';
  if ('image_url' in layer) return 'image';
  if ('rating' in layer) return 'rating';
  if ('chart_data' in layer) return 'chart';
  if ('bar_code_data' in layer) return 'bar_code';
  if ('target' in layer) return 'qr_code';
  return 'shape';
}

function describeError(error: unknown): string {
  const status = readStatus(error);
  const vendorMessage = readVendorMessage(error);
  if (status === undefined) {
    return error instanceof Error ? error.message : String(error);
  }
  const hint = STATUS_HINTS[status] ?? 'Bannerbear request failed';
  return vendorMessage
    ? `${hint} (HTTP ${status}): ${vendorMessage}`
    : `${hint} (HTTP ${status}).`;
}

function readStatus(error: unknown): number | undefined {
  if (error === null || typeof error !== 'object' || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (
    response !== null &&
    typeof response === 'object' &&
    'status' in response &&
    typeof response.status === 'number'
  ) {
    return response.status;
  }
  return undefined;
}

function readVendorMessage(error: unknown): string | undefined {
  if (error === null || typeof error !== 'object' || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (
    response === null ||
    typeof response !== 'object' ||
    !('body' in response)
  ) {
    return undefined;
  }
  const body = response.body;
  if (typeof body === 'string') {
    return body.slice(0, 500);
  }
  if (body !== null && typeof body === 'object') {
    if ('message' in body && typeof body.message === 'string') {
      return body.message;
    }
    if ('error' in body && typeof body.error === 'string') {
      return body.error;
    }
    return JSON.stringify(body).slice(0, 500);
  }
  return undefined;
}

const STATUS_HINTS: Record<number, string> = {
  400: 'Bannerbear rejected the request',
  401: 'Invalid Bannerbear API key',
  402: 'Bannerbear API quota is used up',
  403: 'This API key has no access to that resource',
  404: 'Bannerbear could not find that resource',
  408: 'Bannerbear render timed out',
  422: 'Bannerbear could not process the request',
  429: 'Bannerbear rate limit hit, try again shortly',
  500: 'Bannerbear server error',
  503: 'Bannerbear is temporarily unavailable',
};

const V2_TO_V5_KEYS: Record<string, string> = {
  image_url: 'background-image',
  background: 'background-color',
  font_family: 'font-family',
  font_family_2: 'font-family-secondary',
  color_2: 'color-secondary',
  border_width: 'border-width',
  border_color: 'border-color',
  hide: 'hidden',
  rating: 'rating-score',
  bar_code_data: 'barcode-data',
  target: 'qr-target',
  shadow: 'box-shadow',
};

export type BannerbearApiVersion = 'v2' | 'v5';

export type V2Modification = Record<string, unknown>;

export type RawImage = {
  uid: string;
  status?: string | null;
  template?: unknown;
  image_url?: string | null;
  image_url_png?: string | null;
  image_url_jpg?: string | null;
  pdf_url?: string | null;
  files?: Record<string, string>;
  metadata?: string | null;
  error?: string | null;
  self?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
};

export type NormalizedImage = {
  uid: string;
  status: string | null;
  template_uid: string | null;
  image_url: string | null;
  image_url_png: string | null;
  image_url_jpg: string | null;
  pdf_url: string | null;
  metadata: string | null;
  error: string | null;
  self: string | null;
  created_at: string | null;
  completed_at: string | null;
};

export type RawTemplate = {
  uid: string;
  name?: string | null;
  width?: number | null;
  height?: number | null;
  preview_url?: string | null;
  preview?: string | null;
  tags?: string[];
  created_at?: string | null;
  available_modifications?: (Record<string, unknown> & { name: string })[];
  config?: { objects?: { name?: string; id?: string; type?: string }[] };
};

export type NormalizedLayer = {
  name: string | null;
  id: string | null;
  type: string;
};

export type NormalizedTemplate = {
  uid: string;
  name: string | null;
  width: number | null;
  height: number | null;
  preview_url: string | null;
  tags: string[];
  created_at: string | null;
  layers: NormalizedLayer[];
};
