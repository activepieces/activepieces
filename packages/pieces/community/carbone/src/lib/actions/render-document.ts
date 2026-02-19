import { carboneAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_VERSION = '4';

export const renderDocumentAction = createAction({
  auth: carboneAuth,
  name: 'carbone_render_document',
  displayName: 'Render Document',
  description:
    'Render a stored Carbone template with JSON data and return the generated file as a base64-encoded string.',
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      required: true,
      description:
        'The ID of the Carbone template to render. You can get this from the **Upload Template** action.',
    }),
    data: Property.Json({
      displayName: 'Data (JSON)',
      required: true,
      description:
        'JSON object containing the data to inject into the template. Keys must match the `{d.variableName}` placeholders in your template.',
    }),
    convertTo: Property.ShortText({
      displayName: 'Convert To (optional)',
      required: false,
      description:
        'Output format to convert to (e.g. `pdf`, `xlsx`, `csv`). Leave empty to keep the template\'s native format.',
    }),
    lang: Property.ShortText({
      displayName: 'Language (optional)',
      required: false,
      description:
        'Locale for number/date formatting (e.g. `en-us`, `fr-fr`, `de-de`). Defaults to `en-us`.',
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone (optional)',
      required: false,
      description:
        'Timezone for date formatting (e.g. `Europe/Paris`, `America/New_York`). Defaults to UTC.',
    }),
  },
  async run(context) {
    const { templateId, data, convertTo, lang, timezone } = context.propsValue;

    const body: Record<string, unknown> = {
      data: data as Record<string, unknown>,
      convertTo: convertTo || undefined,
      lang: lang || 'en-us',
      timezone: timezone || 'UTC',
    };

    // Remove undefined fields
    Object.keys(body).forEach((key) => {
      if (body[key] === undefined) {
        delete body[key];
      }
    });

    // Step 1: Start the render job
    const renderRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: `${CARBONE_API_URL}/render/${templateId}`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'carbone-version': CARBONE_VERSION,
        'Content-Type': 'application/json',
      },
      body,
    };

    const renderResponse = await httpClient.sendRequest<{
      success: boolean;
      data: { renderId: string };
      error?: string;
    }>(renderRequest);

    if (!renderResponse.body.success) {
      throw new Error(
        `Carbone render failed: ${renderResponse.body.error ?? 'Unknown error'}`
      );
    }

    const renderId = renderResponse.body.data.renderId;

    // Step 2: Download the rendered document
    const downloadRequest: HttpRequest = {
      method: HttpMethod.GET,
      url: `${CARBONE_API_URL}/render/${renderId}`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'carbone-version': CARBONE_VERSION,
      },
      // Return as buffer so we can base64-encode it
      responseType: 'buffer',
    };

    const downloadResponse =
      await httpClient.sendRequest<Buffer>(downloadRequest);

    const fileBuffer = downloadResponse.body;
    const base64Content = Buffer.isBuffer(fileBuffer)
      ? fileBuffer.toString('base64')
      : Buffer.from(fileBuffer as unknown as string, 'binary').toString(
          'base64'
        );

    // Determine the content-type from the response headers
    const contentType =
      downloadResponse.headers?.['content-type'] ?? 'application/octet-stream';
    const contentDisposition =
      downloadResponse.headers?.['content-disposition'] ?? '';

    // Extract filename from Content-Disposition if available
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : `${renderId}`;

    return {
      renderId,
      filename,
      contentType,
      base64Content,
      sizeBytes: fileBuffer instanceof Buffer ? fileBuffer.length : 0,
    };
  },
});
