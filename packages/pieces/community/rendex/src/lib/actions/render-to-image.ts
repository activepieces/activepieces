import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { RENDEX_BASE_URL } from '../common/common';

export const renderToImage = createAction({
  auth: rendexAuth,
  name: 'render_to_image',
  displayName: 'Render to Image',
  description:
    'Render raw HTML, a URL, or Markdown to an image (PNG, JPEG, WebP) or a PDF.',
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

    // The Source values ("html" | "url" | "markdown") map 1:1 onto both the
    // dynamic field key and the Rendex request field, so the value is forwarded
    // under the same name.
    const sourceValue = content[source_type];
    if (!sourceValue) {
      throw new Error('Please provide content for the selected source.');
    }

    const body: Record<string, unknown> = {
      [source_type]: sourceValue,
      format: format ?? 'png',
      fullPage: full_page ?? false,
    };

    const response = await httpClient.sendRequest<RendexRenderResponse>({
      method: HttpMethod.POST,
      url: `${RENDEX_BASE_URL}/v1/screenshot/json`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const { image, ...metadata } = response.body.data;
    const file = await files.write({
      fileName: `rendex-capture.${metadata.format}`,
      data: Buffer.from(image, 'base64'),
    });

    return { file, ...metadata };
  },
});

type RendexRenderResponse = {
  data: {
    image: string;
    contentType: string;
    url: string;
    width: number;
    height: number;
    format: string;
    bytesSize: number;
    capturedAt: string;
    quality: string;
    waitStrategy: string;
    loadTimeMs: number;
    renderingEngine: string;
  };
};
