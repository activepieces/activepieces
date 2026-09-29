import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { apitemplateIoCreatePdfFromMarkdownOutputSchema } from '../output-schemas';

export const createPdfFromMarkdown = createAction({
  auth: ApitemplateAuth,
  name: 'apitemplate_io_create_pdf_from_markdown',
  outputSchema: apitemplateIoCreatePdfFromMarkdownOutputSchema,
  classification: 'WRITE',
  displayName: 'Create PDF From Markdown',
  description: 'Creates a PDF from Markdown content.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renders a new PDF from raw Markdown text (with optional CSS and templating data). Use when the source is Markdown rather than a saved template, raw HTML, or a live URL. Requires the Markdown body. Not idempotent: each call generates and stores a new PDF.',
    idempotent: false,
  },
  props: {
    body: Property.LongText({
      displayName: 'Markdown Content',
      description: 'The Markdown content to convert to PDF.',
      required: true,
    }),
    css: Property.LongText({
      displayName: 'CSS Styles',
      description: 'Optional CSS styles to apply to the rendered Markdown.',
      required: false,
    }),
    data: Property.Json({
      displayName: 'Template Data',
      description: 'Optional JSON data to use for templating the Markdown content.',
      required: false,
    }),
    expiration: Property.Number({
      displayName: 'Expiration (minutes)',
      description:
        'Expiration of the generated PDF in minutes. Use 0 to store permanently, or 1-10080 minutes (7 days) to specify expiration.',
      required: false,
      defaultValue: 0,
    }),
    meta: Property.ShortText({
      displayName: 'External Reference ID',
      description: 'Specify an external reference ID for your own reference. It appears in the list-objects response.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth.props;
    const { body, css, data, expiration, meta } = propsValue;

    const queryParams = new URLSearchParams();

    if (expiration !== undefined && expiration !== 0) {
      queryParams.append('expiration', expiration.toString());
    }

    if (meta) {
      queryParams.append('meta', meta);
    }

    const endpoint = `/create-pdf-from-markdown${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const requestBody: Record<string, unknown> = { body };

    if (css) {
      requestBody['css'] = css;
    }

    if (data) {
      requestBody['data'] = data;
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.POST,
        endpoint,
        requestBody,
        undefined,
        authConfig.region as ApitemplateRegion
      );

      return response;
    } catch (error: any) {
      if (error.message.includes('502') && authConfig.region !== 'default') {
        throw new Error(
          `${error.message}\n\nThe ${authConfig.region} region appears to be experiencing issues. ` +
            `Consider switching to the 'default' region in your authentication settings or try again later.`
        );
      }
      throw error;
    }
  },
});
