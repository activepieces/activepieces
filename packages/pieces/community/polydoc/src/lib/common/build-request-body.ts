import { PDF_CONVERT_PATH, SCREENSHOT_CONVERT_PATH } from './constants';
import type { JsonObject, PolyDocOperation, PolyDocParams, PolyDocRequest } from './types';

/**
 * Pure assembly of the PolyDoc request body from resolved action params. No I/O
 * and no Activepieces references, so it is unit-testable in isolation and stays
 * the single source of truth for the request shape across all actions.
 */

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merge `source` into `target` (source wins). Arrays and scalars overwrite. */
export function mergeDeep(target: JsonObject, source: JsonObject): JsonObject {
  const out: JsonObject = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = mergeDeep(out[key] as JsonObject, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function resolveSource(params: PolyDocParams): string {
  switch (params.sourceType) {
    case 'url':
      return params.url ?? '';
    case 'html':
      return params.html ?? '';
    case 'template':
      return `[template:${params.templateId ?? ''}]`;
    default:
      return '';
  }
}

function buildLayout(opts: JsonObject): JsonObject | undefined {
  const layout: JsonObject = {};
  if (typeof opts['format'] === 'string' && opts['format'] !== '') {
    layout['format'] = opts['format'];
  }
  for (const flag of ['landscape', 'printBackground', 'outline', 'tagged'] as const) {
    if (typeof opts[flag] === 'boolean') {
      layout[flag] = opts[flag];
    }
  }
  if (typeof opts['scale'] === 'number') {
    layout['scale'] = opts['scale'];
  }
  if (typeof opts['pageRanges'] === 'string' && opts['pageRanges'] !== '') {
    layout['pageRanges'] = opts['pageRanges'];
  }

  const margins = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const;
  if (margins.some((m) => opts[m] !== undefined && opts[m] !== '')) {
    layout['margin'] = {
      top: opts['marginTop'] ?? '0',
      right: opts['marginRight'] ?? '0',
      bottom: opts['marginBottom'] ?? '0',
      left: opts['marginLeft'] ?? '0',
    };
  }
  return Object.keys(layout).length > 0 ? layout : undefined;
}

function buildScreenshot(opts: JsonObject): JsonObject | undefined {
  const shot: JsonObject = {};
  if (typeof opts['imageType'] === 'string' && opts['imageType'] !== '') {
    shot['type'] = opts['imageType'];
  }
  if (typeof opts['fullPage'] === 'boolean') {
    shot['fullPage'] = opts['fullPage'];
  }
  if (typeof opts['quality'] === 'number') {
    shot['quality'] = opts['quality'];
  }
  if (opts['encoding'] === 'base64') {
    shot['encoding'] = 'base64';
  }
  if (typeof opts['viewportWidth'] === 'number' && typeof opts['viewportHeight'] === 'number') {
    const viewport: JsonObject = {
      width: opts['viewportWidth'],
      height: opts['viewportHeight'],
    };
    if (typeof opts['devicePixelRatio'] === 'number' && (opts['devicePixelRatio'] as number) > 0) {
      viewport['devicePixelRatio'] = opts['devicePixelRatio'];
    }
    shot['viewport'] = viewport;
  }
  return Object.keys(shot).length > 0 ? shot : undefined;
}

/**
 * Assemble the PolyDoc request body. Returns the endpoint to call, the body to
 * send, and whether the default (binary) delivery is in effect.
 */
export function buildRequestBody(params: PolyDocParams): PolyDocRequest {
  const endpoint = params.operation === 'screenshot' ? SCREENSHOT_CONVERT_PATH : PDF_CONVERT_PATH;
  const body: JsonObject = {
    source: resolveSource(params),
  };

  if (params.templateData && Object.keys(params.templateData).length > 0) {
    body['templateData'] = params.templateData;
  }
  if (params.filename) {
    body['filename'] = params.filename;
  }
  if (params.tag) {
    body['tag'] = params.tag;
  }
  if (typeof params.timeout === 'number' && params.timeout > 0) {
    body['timeout'] = params.timeout;
  }

  if (params.operation === 'pdf') {
    const layout = params.pdfOptions ? buildLayout(params.pdfOptions) : undefined;
    if (layout) {
      body['layout'] = layout;
    }
  }

  if (params.operation === 'screenshot') {
    const shot = params.screenshotOptions ? buildScreenshot(params.screenshotOptions) : undefined;
    if (shot) {
      body['screenshot'] = shot;
    }
  }

  if (params.operation === 'einvoice') {
    const eInvoice: JsonObject = {
      standard: params.eInvoiceStandard,
      profile: params.eInvoiceProfile,
      invoice: params.invoice ?? {},
    };
    if (typeof params.eInvoiceVerify === 'boolean') {
      eInvoice['verify'] = params.eInvoiceVerify;
    }
    body['eInvoice'] = eInvoice;
  }

  const delivery = params.delivery ?? { mode: 'download' };
  const isBinary = delivery.mode === 'download';
  if (delivery.mode === 'cloudStorage' && delivery.presignedUrl) {
    body['cloudStorage'] = {
      presignedUrl: delivery.presignedUrl,
    };
  }
  if (delivery.mode === 'webhook' && delivery.webhook) {
    body['webhook'] = delivery.webhook;
  }

  const merged =
    params.advanced && Object.keys(params.advanced).length > 0
      ? mergeDeep(body, params.advanced)
      : body;

  return {
    endpoint,
    body: merged,
    isBinary,
  };
}

/** Default output filename when the user did not set one. */
export function defaultFilename(operation: PolyDocOperation, imageType?: string): string {
  if (operation === 'screenshot') {
    const ext = imageType === 'jpeg' ? 'jpg' : (imageType ?? 'png');
    return `screenshot.${ext}`;
  }
  return 'document.pdf';
}
