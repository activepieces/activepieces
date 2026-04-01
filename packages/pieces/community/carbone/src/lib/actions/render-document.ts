import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { CARBONE_API_URL, CARBONE_VERSION } from '../common/constants';
import { carboneProps } from '../common/props';

export const renderDocumentAction = createAction({
  auth: carboneAuth,
  name: 'carbone_render_document',
  displayName: 'Render Document',
  description: 'Render a Carbone template with JSON data and download the generated document.',
  props: {
    templateId: carboneProps.templateDropdown({
      displayName: 'Template ID',
      description: 'Select a template to render.',
      showIdInLabel: false,
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
        'Output format (e.g. `pdf`, `xlsx`, `csv`, `docx`). For PDF, you can also use advanced options via JSON like `{"formatName":"pdf","formatOptions":{"Watermark":"Confidential"}}`.',
    }),
    lang: Property.ShortText({
      displayName: 'Language (optional)',
      required: false,
      description:
        'Locale for number/date formatting (e.g. `en-us`, `fr-fr`, `de-de`). Defaults to `en-us`.',
    }),
    converter: Property.StaticDropdown({
      displayName: 'PDF Converter (optional)',
      required: false,
      description:
        'PDF converter engine: **L** (LibreOffice, default - best balance), **O** (OnlyOffice - ideal for DOCX/XLSX/PPTX), **C** (Chromium - high-fidelity HTML-to-PDF). Only applies when convertTo is "pdf" or an object with formatName "pdf".',
      options: {
        options: [
          { label: 'LibreOffice (L) - Default', value: 'L' },
          { label: 'OnlyOffice (O) - Office docs', value: 'O' },
          { label: 'Chromium (C) - HTML-to-PDF', value: 'C' },
        ],
      },
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone (optional)',
      required: false,
      description:
        'Timezone for date formatting (e.g. `Europe/Paris`, `America/New_York`). Defaults to UTC.',
    }),
    reportName: Property.ShortText({
      displayName: 'Report Name (optional)',
      required: false,
      description:
        'Custom filename for the generated document. Can use template variables like `{d.date}`. Returned in Content-Disposition header.',
    }),
    complement: Property.Json({
      displayName: 'Complement Data (optional)',
      required: false,
      description:
        'Extra data object merged into template with tags `{c.}` (complement prefix).',
    }),
    currencySource: Property.ShortText({
      displayName: 'Currency Source (optional)',
      required: false,
      description:
        'Source currency code (e.g. `EUR`) for currency conversion. Use with Currency Target and Currency Rates.',
    }),
    currencyTarget: Property.ShortText({
      displayName: 'Currency Target (optional)',
      required: false,
      description:
        'Target currency code (e.g. `USD`) for currency conversion. Used by formatC formatter.',
    }),
    currencyRates: Property.Json({
      displayName: 'Currency Rates (optional)',
      required: false,
      description:
        'Exchange rates object for currency conversion. Example: `{"EUR": 1, "USD": 1.14}`.',
    }),
  },
  async run(context) {
    const { templateId, data, convertTo, converter, lang, timezone, reportName, complement, currencySource, currencyTarget, currencyRates } = context.propsValue;

    const body: Record<string, unknown> = {
      data: data as Record<string, unknown>,
      convertTo: convertTo || undefined,
      converter: converter || undefined,
      lang: lang || 'en-us',
      timezone: timezone || 'UTC',
      reportName: reportName || undefined,
      complement: complement || undefined,
      currencySource: currencySource || undefined,
      currencyTarget: currencyTarget || undefined,
      currencyRates: currencyRates || undefined,
    };

    Object.keys(body).forEach((key) => {
      if (body[key] === undefined) {
        delete body[key];
      }
    });

    // Call render with download=true to get file directly (v5 feature)
    const renderRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: `${CARBONE_API_URL}/render/${templateId}?download=true`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'carbone-version': CARBONE_VERSION,
        'Content-Type': 'application/json',
      },
      body,
      responseType: 'arraybuffer',
    };

    const renderResponse = await httpClient.sendRequest<ArrayBuffer>(renderRequest);

    const fileBuffer = Buffer.from(renderResponse.body);

    // Determine the content-type from the response headers
    const contentType =
      renderResponse.headers?.['content-type'] ?? 'application/octet-stream';
    const contentDispositionHeader =
      renderResponse.headers?.['content-disposition'] ?? '';
    const contentDisposition = Array.isArray(contentDispositionHeader)
      ? contentDispositionHeader[0]
      : contentDispositionHeader;

    // Extract filename from Content-Disposition if available
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : `report-${Date.now()}`;

    // Save file
    const file = await context.files.write({
      fileName: filename,
      data: fileBuffer,
    });

    return {
      filename,
      contentType,
      file,
      sizeBytes: fileBuffer.length,
    };
  },
});
