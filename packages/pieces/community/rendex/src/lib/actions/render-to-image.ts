import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS, rendexInput } from '../common/common';
import { renderToImageOutputSchema } from '../common/output-schemas';

export const renderToImage = createAction({
  auth: rendexAuth,
  name: 'render_to_image',
  classification: 'READ',
  displayName: 'Render to Image',
  description:
    'Render raw HTML, a URL, or Markdown to an image (PNG, JPEG, WebP) or a PDF.',
  audience: 'human',
  aiMetadata: {
    description:
      'Human flow-builder version of Render Screenshot: renders HTML, a URL or Markdown chosen with a Source switch into a PNG, JPEG, WebP or PDF file. Agents should use Render Screenshot, which takes URL, HTML or Markdown directly and exposes viewport, element, wait and extraction options. Each call spends one Rendex credit and creates a new file, so retries render again.',
    idempotent: false,
  },
  outputSchema: renderToImageOutputSchema,
  props: {
    source_type: Property.StaticDropdown({
      displayName: 'Source',
      description: 'Render from raw HTML, a live URL, or Markdown.',
      required: true,
      defaultValue: 'html',
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'URL', value: 'url' },
          { label: 'Markdown', value: 'markdown' },
        ],
      },
    }),
    content: Property.DynamicProperties({
      auth: rendexAuth,
      displayName: 'Content',
      description: 'The content to render, based on the Source you selected.',
      required: true,
      refreshers: ['source_type'],
      props: async ({ source_type }): Promise<DynamicPropsValue> => {
        if (source_type === 'url') {
          return {
            url: Property.ShortText({
              displayName: 'URL',
              description: 'The page URL to render.',
              required: true,
            }),
          };
        }
        if (source_type === 'markdown') {
          return {
            markdown: Property.LongText({
              displayName: 'Markdown',
              description: 'The Markdown to render.',
              required: true,
            }),
          };
        }
        return {
          html: Property.LongText({
            displayName: 'HTML',
            description: 'The HTML markup to render.',
            required: true,
          }),
        };
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'png',
      options: {
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'JPEG', value: 'jpeg' },
          { label: 'WebP', value: 'webp' },
          { label: 'PDF', value: 'pdf' },
        ],
      },
    }),
    full_page: Property.Checkbox({
      displayName: 'Full Page',
      description: 'Capture the full scrollable page instead of just the viewport.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue, files } = context;
    const { source_type, content, format, full_page } = propsValue;
    const sourceValue = content[source_type];
    if (!sourceValue) {
      throw new Error('Please provide content for the selected source.');
    }
    if (typeof sourceValue === 'string' && source_type !== 'url') {
      rendexInput.checkContentSize({ value: sourceValue, label: source_type === 'markdown' ? 'Markdown' : 'HTML', maxBytes: RENDEX_LIMITS.MAX_SOURCE_BYTES });
    }
    const { data, meta } = await rendexClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/v1/screenshot/json',
      body: {
        [source_type]: sourceValue,
        format: format ?? 'png',
        fullPage: full_page ?? false,
        ...(source_type === 'url' ? {} : { waitUntil: 'load' }),
      },
      timeoutMs: RENDEX_LIMITS.RENDER_TIMEOUT_MS,
      operation: 'render the image',
    });
    const record = rendexInput.isRecord(data) ? data : {};
    const image = record['image'];
    if (typeof image !== 'string' || image === '') {
      throw new Error('Rendex could not render the image: the response had no image data.');
    }
    const metadata = Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'image'));
    const file = await files.write({
      fileName: `rendex-capture.${String(metadata['format'] ?? format ?? 'png')}`,
      data: Buffer.from(image, 'base64'),
    });
    return { file, ...metadata, usage: meta?.['usage'] ?? null };
  },
});
