import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS, rendexInput } from '../common/common';
import { RENDEX_OPTIONS, rendexProps } from '../common/props';
import { createArtifactOutputSchema } from '../common/output-schemas';

const INPUT_FORMAT_OPTIONS = [
  { label: 'Markdown', value: 'markdown' },
  { label: 'HTML', value: 'html' },
];

const OUTPUT_FORMAT_OPTIONS = [
  { label: 'PDF', value: 'pdf' },
  { label: 'PNG', value: 'png' },
];

const ORIENTATION_OPTIONS = [
  { label: 'Portrait', value: 'portrait' },
  { label: 'Landscape', value: 'landscape' },
];

const INPUT_FORMAT_VALUES = INPUT_FORMAT_OPTIONS.map((option) => option.value);
const OUTPUT_FORMAT_VALUES = OUTPUT_FORMAT_OPTIONS.map((option) => option.value);
const ORIENTATION_VALUES = ORIENTATION_OPTIONS.map((option) => option.value);

function formatsOf(value: unknown): string[] | undefined {
  const list = rendexInput.textListOf({ value, label: 'Output Formats', maxItems: 2, maxLength: 10 });
  if (list === undefined) return undefined;
  const formats = [...new Set(list.map((item) => item.toLowerCase()))];
  const wrong = formats.find((item) => !OUTPUT_FORMAT_VALUES.includes(item));
  if (wrong !== undefined) {
    throw new Error(`Output Formats accepts pdf and png. Got "${wrong.slice(0, 20)}".`);
  }
  return formats;
}

export const createArtifact = createAction({
  auth: rendexAuth,
  name: 'create_artifact',
  classification: 'WRITE',
  displayName: 'Create Branded Document',
  description: 'Turn Markdown or HTML into a branded PDF and/or PNG with your logo, colour, header and footer, and get hosted links. Rendex offers no wait option here, so this call can fail with HTTP 408 TIMEOUT on the vendor side; if it does, use Render Screenshot with Format PDF and Wait Until Load event instead.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turns Markdown or HTML (a report, invoice or summary) into a branded PDF and/or PNG with optional logo, accent colour, font, header and footer, and returns hosted download links plus a share link that expire. Use Render Screenshot for a plain capture of a URL or HTML without branding. Known vendor limitation: Rendex has no wait option for this endpoint and it can fail with 408 TIMEOUT; then fall back to Render Screenshot with Format pdf and Wait Until load. Costs one Rendex credit per requested format (refunded on failure); each call creates new documents, so retries create more.',
    idempotent: false,
  },
  outputSchema: createArtifactOutputSchema,
  props: {
    content: Property.LongText({
      displayName: 'Content',
      description: 'The Markdown or HTML to turn into a document (up to 4 MB).',
      required: true,
    }),
    input_format: rendexProps.choice({
      displayName: 'Content Format',
      description: 'Whether Content is Markdown or HTML. Default Markdown.',
      values: INPUT_FORMAT_OPTIONS,
    }),
    formats: Property.StaticMultiSelectDropdown({
      displayName: 'Output Formats',
      description: 'Which files to create. Default both PDF and PNG; each format costs one credit.',
      required: false,
      options: { options: OUTPUT_FORMAT_OPTIONS },
    }),
    logo_url: Property.ShortText({ displayName: 'Logo URL', description: 'Public URL of a logo image to place on the document.', required: false }),
    accent_color: Property.ShortText({ displayName: 'Accent Colour', description: 'Brand colour as a hex code, like #4f46e5.', required: false }),
    font: Property.ShortText({ displayName: 'Font', description: 'Font family name, like Inter.', required: false }),
    header: Property.ShortText({ displayName: 'Header', description: 'Text shown at the top of the document.', required: false }),
    footer: Property.ShortText({ displayName: 'Footer', description: 'Text shown at the bottom of the document.', required: false }),
    page_size: rendexProps.choice({ displayName: 'Page Size', description: 'Paper size of the PDF. Default A4.', values: RENDEX_OPTIONS.PAPER_OPTIONS }),
    orientation: rendexProps.choice({ displayName: 'Orientation', description: 'Page orientation. Default portrait.', values: ORIENTATION_OPTIONS }),
    template_data: Property.Json({
      displayName: 'Template Data',
      description: 'Values for Rendex {{placeholders}} in Content, like {"customer": "Ada"} (up to 256 KB). Activepieces replaces {{...}} that you type in a field with its own data before Rendex sees it, so placeholders typed here never reach Rendex. Template Data only works when the HTML or Markdown with {{placeholders}} is mapped in from an earlier step (mapped values are passed as-is); otherwise insert the values directly with the data selector.',
      required: false,
    }),
    expires_in_seconds: Property.Number({
      displayName: 'Expires In (seconds)',
      description: 'How long the links stay valid, 3600 (1 hour) to 2592000 (30 days). Default 1 day.',
      required: false,
    }),
  },
  async run(context) {
    const values: Record<string, unknown> = { ...context.propsValue };
    const content = typeof values['content'] === 'string' ? values['content'] : '';
    if (content.trim() === '') {
      throw new Error('Content is required.');
    }
    rendexInput.checkContentSize({ value: content, label: 'Content', maxBytes: RENDEX_LIMITS.MAX_ARTIFACT_BYTES });
    const branding = rendexInput.compact({
      logo: rendexInput.textOf({ value: values['logo_url'], label: 'Logo URL', maxLength: 2048 }),
      accentColor: rendexInput.textOf({ value: values['accent_color'], label: 'Accent Colour', maxLength: 32 }),
      font: rendexInput.textOf({ value: values['font'], label: 'Font', maxLength: 100 }),
      header: rendexInput.textOf({ value: values['header'], label: 'Header', maxLength: 500 }),
      footer: rendexInput.textOf({ value: values['footer'], label: 'Footer', maxLength: 500 }),
    });
    const pageSetup = rendexInput.compact({
      size: rendexInput.choiceOf({ value: values['page_size'], label: 'Page Size', allowed: RENDEX_OPTIONS.PAPER_VALUES }),
      orientation: rendexInput.choiceOf({ value: values['orientation'], label: 'Orientation', allowed: ORIENTATION_VALUES }),
    });
    const body = rendexInput.compact({
      content,
      inputFormat: rendexInput.choiceOf({ value: values['input_format'], label: 'Content Format', allowed: INPUT_FORMAT_VALUES }),
      formats: formatsOf(values['formats']),
      branding: Object.keys(branding).length === 0 ? undefined : branding,
      pageSetup: Object.keys(pageSetup).length === 0 ? undefined : pageSetup,
      data: rendexInput.jsonObjectOf({ value: values['template_data'], label: 'Template Data', maxBytes: RENDEX_LIMITS.MAX_TEMPLATE_DATA_BYTES }),
      expiresIn: rendexInput.numberOf({ value: values['expires_in_seconds'], ...RENDEX_LIMITS.EXPIRES }),
    });
    return rendexClient.requestData({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/artifact',
      body,
      timeoutMs: RENDEX_LIMITS.RENDER_TIMEOUT_MS,
      operation: 'create the branded document',
    });
  },
});
