import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { RENDEX_BASE_URL } from '../common/common';

export const renderToImage = createAction({
  auth: rendexAuth,
  name: 'render_to_image',
  displayName: 'Render to Image',
  description:
    'Render raw HTML or a URL to a PNG, JPEG, or WebP image (or a PDF) and get back the result as base64.',
  props: {
    source_type: Property.StaticDropdown({
      displayName: 'Source',
      description: 'Render from raw HTML or from a live URL.',
      required: true,
      defaultValue: 'html',
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'URL', value: 'url' },
        ],
      },
    }),
    html: Property.LongText({
      displayName: 'HTML',
      description: 'The HTML markup to render. Required when Source is "HTML".',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The page URL to render. Required when Source is "URL".',
      required: false,
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
    const { auth, propsValue } = context;
    const { source_type, html, url, format, full_page } = propsValue;

    // Guard the source-specific field: both html and url are optional at the
    // form level (only one applies), so fail clearly here instead of sending a
    // body with neither key (JSON.stringify drops undefined) and getting an
    // opaque server-side error.
    if (source_type === 'url' && !url) {
      throw new Error('A URL is required when Source is set to "URL".');
    }
    if (source_type === 'html' && !html) {
      throw new Error('HTML is required when Source is set to "HTML".');
    }

    const body: Record<string, unknown> = {
      format: format ?? 'png',
      fullPage: full_page ?? false,
    };
    if (source_type === 'url') {
      body['url'] = url;
    } else {
      body['html'] = html;
    }

    const response = await httpClient.sendRequest<{
      data: {
        image: string;
        contentType: string;
        format: string;
        bytesSize: number;
      };
    }>({
      method: HttpMethod.POST,
      url: `${RENDEX_BASE_URL}/v1/screenshot/json`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body.data;
  },
});
