import { Property } from '@activepieces/pieces-framework';
import { DELIVERY_MODES, SOURCE_TYPES } from './constants';
import type {
  JsonObject,
  PolyDocDelivery,
  PolyDocDeliveryMode,
  PolyDocParams,
  PolyDocSourceType,
} from './types';

// Activepieces has no n8n-style conditional show/hide for static props and its
// DynamicProperties cannot render a multiline (LongText) field, so the source
// and delivery inputs are flat optional props resolved at run time by the
// selected Source Type / Delivery mode.

export const sourceTypeProp = (defaultValue: PolyDocSourceType = 'url') =>
  Property.StaticDropdown({
    displayName: 'Source Type',
    description: 'Where the content comes from',
    required: true,
    defaultValue,
    options: {
      disabled: false,
      options: SOURCE_TYPES.map((o) => ({ label: o.label, value: o.value })),
    },
  });

export const sourceProp = Property.LongText({
  displayName: 'Source',
  description: 'The URL, inline HTML, or saved template ID, matching the Source Type above.',
  required: true,
});

export const templateDataProp = Property.Json({
  displayName: 'Template Data',
  description: 'Data passed to the Liquid template renderer (used only when Source Type is Template).',
  required: false,
  defaultValue: {},
});

export const deliveryModeProp = Property.StaticDropdown({
  displayName: 'Delivery',
  description: 'How the generated file is returned',
  required: true,
  defaultValue: 'download',
  options: {
    disabled: false,
    options: DELIVERY_MODES.map((o) => ({ label: o.label, value: o.value })),
  },
});

export const presignedUrlProp = Property.ShortText({
  displayName: 'Presigned URL',
  description: 'HTTP PUT presigned URL from your storage provider (required for Cloud Storage delivery).',
  required: false,
});

export const webhookUrlProp = Property.ShortText({
  displayName: 'Webhook URL',
  description: 'URL the generated file is delivered to (required for Webhook delivery).',
  required: false,
});

export const webhookOptionsProp = Property.Json({
  displayName: 'Webhook Options',
  description: 'Extra webhook settings merged with the URL: async, method, headers, retries, retryDelay, timeout.',
  required: false,
  defaultValue: {},
});

export const filenameProp = Property.ShortText({
  displayName: 'Filename',
  description: 'Output filename (overrides the default).',
  required: false,
});

export const tagProp = Property.ShortText({
  displayName: 'Tag',
  description: 'Label for logging and analytics (max 30 characters).',
  required: false,
});

export const timeoutProp = Property.Number({
  displayName: 'Timeout (ms)',
  description: 'Conversion timeout in milliseconds.',
  required: false,
});

export const advancedProp = Property.Json({
  displayName: 'Advanced (JSON)',
  description:
    'Raw fields deep-merged into the request body for any API option not exposed above (e.g. pdf.watermark, pdf.pdfa, render, request).',
  required: false,
  defaultValue: {},
});

/** Coerce a Property.Json / object / JSON-string value into a non-empty plain object. */
export function asJsonObject(value: unknown): JsonObject | undefined {
  let candidate = value;
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (trimmed === '') {
      return undefined;
    }
    try {
      candidate = JSON.parse(trimmed);
    } catch {
      return undefined;
    }
  }
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    const obj = candidate as JsonObject;
    return Object.keys(obj).length > 0 ? obj : undefined;
  }
  return undefined;
}

type Props = Record<string, unknown>;

export function resolveSourceParams(
  props: Props,
): Pick<PolyDocParams, 'sourceType' | 'url' | 'html' | 'templateId' | 'templateData'> {
  const sourceType = ((props['sourceType'] as PolyDocSourceType) ?? 'url') as PolyDocSourceType;
  const source = (props['source'] as string) ?? '';
  if (sourceType === 'html') {
    return { sourceType, html: source };
  }
  if (sourceType === 'template') {
    return { sourceType, templateId: source, templateData: asJsonObject(props['templateData']) };
  }
  return { sourceType, url: source };
}

export function resolveDelivery(props: Props): PolyDocDelivery {
  const mode = ((props['deliveryMode'] as PolyDocDeliveryMode) ?? 'download') as PolyDocDeliveryMode;
  if (mode === 'cloudStorage') {
    const presignedUrl = (props['presignedUrl'] as string) ?? '';
    if (!presignedUrl) {
      throw new Error('Cloud Storage delivery requires a Presigned URL.');
    }
    return { mode, presignedUrl };
  }
  if (mode === 'webhook') {
    const url = (props['webhookUrl'] as string) ?? '';
    if (!url) {
      throw new Error('Webhook delivery requires a Webhook URL.');
    }
    const extra = asJsonObject(props['webhookOptions']) ?? {};
    return { mode, webhook: { url, ...extra } };
  }
  return { mode: 'download' };
}

export function resolveMetadata(
  props: Props,
): Pick<PolyDocParams, 'filename' | 'tag' | 'timeout' | 'advanced'> {
  return {
    filename: (props['filename'] as string) || undefined,
    tag: (props['tag'] as string) || undefined,
    timeout: typeof props['timeout'] === 'number' ? (props['timeout'] as number) : undefined,
    advanced: asJsonObject(props['advanced']),
  };
}
