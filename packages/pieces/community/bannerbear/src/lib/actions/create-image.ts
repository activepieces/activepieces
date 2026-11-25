import {
  createAction,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import {
  bannerbearClient,
  RawTemplate,
  V2Modification,
} from '../common/client';
import { bannerbearProps } from '../common/props';
import { bannerbearOutputSchemas } from '../output-schemas';

export const bannerbearCreateImageAction = createAction({
  auth: bannerbearAuth,
  name: 'bannerbear_create_image',
  classification: 'WRITE',
  displayName: 'Create Image',
  description: 'Create image from Bannerbear template',
  audience: 'human',
  aiMetadata: {
    description:
      'Renders a new image (or PDF) from a Bannerbear template picked from a dropdown, with one input group per template layer. Agents should use Create Image from JSON instead. Each call submits a new render and uses a credit.',
    idempotent: false,
  },
  outputSchema: bannerbearOutputSchemas['createImage'],
  props: {
    template: bannerbearProps.template({ required: true }),
    template_version: Property.Number({
      displayName: 'Template version',
      description: 'Render a specific template version. Leave empty for latest.',
      required: false,
    }),
    modifications: Property.DynamicProperties({
      auth: bannerbearAuth,
      displayName: 'Template modifications',
      description: 'Values for each template layer. Empty fields are skipped.',
      required: true,
      refreshers: ['template'],
      props: async ({ auth, template }) => {
        const templateUid = bannerbearClient.readTemplateUid(template);
        if (!auth || !templateUid) return {};
        const apiKey = auth.secret_text;
        const raw = await bannerbearClient.request<RawTemplate>({
          apiKey,
          method: HttpMethod.GET,
          path: bannerbearClient.templatePath({ apiKey, uid: templateUid }),
        });
        const normalized = bannerbearClient.normalizeTemplate(raw);
        const fields: InputPropertyMap = {};
        for (const layer of normalized.layers) {
          if (!layer.name) continue;
          for (const field of fieldsForLayer(layer.type)) {
            fields[`${layer.name}${SEPARATOR}${field.key}`] = buildFieldProp({
              layerName: layer.name,
              field,
            });
          }
        }
        return fields;
      },
    }),
    transparent: Property.Checkbox({
      displayName: 'Transparent background',
      description: 'Render a PNG with a transparent background.',
      required: false,
    }),
    render_pdf: Property.Checkbox({
      displayName: 'Render a PDF',
      description: 'Also render a PDF (uses extra credits).',
      required: false,
    }),
    metadata: Property.LongText({
      displayName: 'Metadata',
      description: 'Any text to store with the image, e.g. a record ID.',
      required: false,
    }),
    wait_for_completion: bannerbearProps.waitForCompletion,
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const templateUid = bannerbearClient.readTemplateUid(propsValue.template);
    if (!templateUid) {
      throw new Error('Please select a template.');
    }
    const templateVersion = toOptionalInteger(propsValue.template_version);
    const body = bannerbearClient.buildImageRequest({
      apiKey,
      templateUid,
      modifications: toModifications(propsValue.modifications ?? {}),
      transparent: propsValue.transparent,
      renderPdf: propsValue.render_pdf,
      metadata: propsValue.metadata,
      templateVersion,
    });
    return bannerbearClient.createImageAndWait({
      apiKey,
      body,
      wait: propsValue.wait_for_completion !== false,
    });
  },
});

function toModifications(values: Record<string, unknown>): V2Modification[] {
  const legacyName = values['name'];
  if (typeof legacyName === 'string' && legacyName.trim() !== '') {
    return [cleanLegacy(values)];
  }
  const byLayer = new Map<string, V2Modification>();
  for (const [key, value] of Object.entries(values)) {
    const index = key.lastIndexOf(SEPARATOR);
    if (index < 0 || isEmptyValue(value)) {
      continue;
    }
    const layer = key.slice(0, index);
    const field = key.slice(index + SEPARATOR.length);
    const current = byLayer.get(layer) ?? { name: layer };
    byLayer.set(layer, { ...current, [field]: coerceField({ field, value }) });
  }
  return Array.from(byLayer.values());
}

function cleanLegacy(values: Record<string, unknown>): V2Modification {
  const result: V2Modification = {};
  for (const [key, value] of Object.entries(values)) {
    if (isEmptyValue(value)) continue;
    result[key] = coerceField({ field: key, value });
  }
  return result;
}

function coerceField({
  field,
  value,
}: {
  field: string;
  value: unknown;
}): unknown {
  if (NUMBER_FIELDS.includes(field)) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new Error(`"${field}" must be a number, got "${String(value)}".`);
    }
    return n;
  }
  if (field === 'gradient' && typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        throw new Error('Gradient must be a list like ["#000","#FFF"].');
      }
    }
    return trimmed.split(',').map((c) => c.trim()).filter((c) => c !== '');
  }
  return value;
}

function toOptionalInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('Template version must be a whole number of 1 or more.');
  }
  return n;
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function fieldsForLayer(type: string): LayerField[] {
  const result: LayerField[] = [];
  const keys = new Set<string>();
  for (const field of [...(LAYER_FIELDS[type] ?? []), ...COMMON_FIELDS]) {
    if (keys.has(field.key)) continue;
    keys.add(field.key);
    result.push(field);
  }
  return result;
}

function buildFieldProp({
  layerName,
  field,
}: {
  layerName: string;
  field: LayerField;
}) {
  const options = {
    displayName: `${layerName}: ${field.label}`,
    description: field.description,
    required: false,
  };
  if (field.kind === 'checkbox') return Property.Checkbox(options);
  if (field.kind === 'number') return Property.Number(options);
  return Property.ShortText(options);
}

const SEPARATOR = '::';

const NUMBER_FIELDS = ['rating', 'border_width', 'shift_x', 'shift_y'];

const COMMON_FIELDS: LayerField[] = [
  { key: 'color', label: 'Color', description: 'Hex color, e.g. #FF0000.' },
  { key: 'gradient', label: 'Gradient', description: 'Fill with a gradient, e.g. ["#000","#FFF"] or #000,#FFF.' },
  { key: 'border_width', label: 'Border Width', description: 'Width of the layer border.', kind: 'number' },
  { key: 'border_color', label: 'Border Color', description: 'Hex color, e.g. #FF0000.' },
  { key: 'shift_x', label: 'Shift X', description: 'Move the layer along the x axis (pixels).', kind: 'number' },
  { key: 'shift_y', label: 'Shift Y', description: 'Move the layer along the y axis (pixels).', kind: 'number' },
  { key: 'target', label: 'Link Target', description: 'Clickable link URL on this layer when rendering a PDF.' },
  { key: 'hide', label: 'Hide', description: 'Hide this layer.', kind: 'checkbox' },
];

const TEXT_FIELDS: LayerField[] = [
  { key: 'text', label: 'Text', description: 'Replacement text.' },
  { key: 'color', label: 'Text Color', description: 'Hex color, e.g. #FF0000.' },
  { key: 'background', label: 'Background', description: 'Hex color, e.g. #000000.' },
  { key: 'font_family', label: 'Font', description: 'Font family name.' },
  { key: 'text_align_h', label: 'Horizontal Align', description: 'left, center or right.' },
  { key: 'text_align_v', label: 'Vertical Align', description: 'top, center or bottom.' },
  { key: 'font_family_2', label: 'Secondary Font', description: 'Secondary font family name.' },
  { key: 'color_2', label: 'Secondary Text Color', description: 'Hex color for the secondary font.' },
];

const IMAGE_FIELDS: LayerField[] = [
  { key: 'image_url', label: 'Image URL', description: 'Public URL of the image.' },
  { key: 'effect', label: 'Effect', description: 'Image effect name, e.g. Grayscale.' },
  { key: 'anchor_x', label: 'Anchor X', description: 'left, center or right.' },
  { key: 'anchor_y', label: 'Anchor Y', description: 'top, center or bottom.' },
  { key: 'fill_type', label: 'Fill Type', description: 'fill or fit.' },
  { key: 'disable_face_detect', label: 'Disable Face Detect', description: 'Turn off face detection for this render.', kind: 'checkbox' },
  { key: 'disable_smart_crop', label: 'Disable Smart Crop', description: 'Turn off smart crop for this render.', kind: 'checkbox' },
];

const LAYER_FIELDS: Record<string, LayerField[]> = {
  text: TEXT_FIELDS,
  image: IMAGE_FIELDS,
  rectangle_image_container: IMAGE_FIELDS,
  circle_image_container: IMAGE_FIELDS,
  rating: [
    { key: 'rating', label: 'Rating', description: 'Number from 0 to 100.', kind: 'number' },
  ],
  chart: [
    { key: 'chart_data', label: 'Chart Data', description: 'Comma-separated numbers, e.g. 10,20,30.' },
  ],
  bar_code: [
    { key: 'bar_code_data', label: 'Bar Code Data', description: 'Text to encode as a bar code.' },
  ],
  qr_code: [
    { key: 'target', label: 'QR Code Target', description: 'URL or text to encode in the QR code.' },
  ],
};

type LayerField = {
  key: string;
  label: string;
  description: string;
  kind?: 'text' | 'number' | 'checkbox';
};
