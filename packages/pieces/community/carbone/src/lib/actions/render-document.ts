import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient, carboneOutputFields } from '../common/client';
import { carboneProps } from '../common/props';

export const renderDocumentAction = createAction({
  auth: carboneAuth,
  name: 'carbone_render_document',
  classification: 'WRITE',
  displayName: 'Render Document',
  description: 'Render a stored Carbone template with JSON data and download the generated document.',
  audience: 'both',
  aiMetadata: {
    description: 'Merges a stored Carbone template (referenced by template ID or version ID) with a JSON data object and returns the generated document as a file, optionally converted to another format such as PDF, XLSX or DOCX. Use after the template is uploaded (Upload Template) and its ID is known (List Templates). The JSON keys must match the `{d.variableName}` placeholders in the template. Each call spends Carbone render credits. Not idempotent: every call generates and stores a new file.',
    idempotent: false,
  },
  outputSchema: { fields: carboneOutputFields.file },
  props: {
    templateId: carboneProps.templateDropdown({
      displayName: 'Template ID',
      description: 'Select a template to render, or map a template ID or version ID.',
      showIdInLabel: false,
    }),
    data: Property.Json({
      displayName: 'Data (JSON)',
      required: true,
      description:
        'JSON object containing the data to inject into the template. Keys must match the `{d.variableName}` placeholders in your template.',
    }),
    convertTo: carboneProps.convertTo(),
    lang: carboneProps.lang(),
    converter: carboneProps.converter(),
    timezone: carboneProps.timezone(),
    reportName: carboneProps.reportName(),
    complement: Property.Json({
      displayName: 'Complement Data (optional)',
      required: false,
      description: 'Extra data object merged into the template with `{c.}` tags.',
    }),
    currencySource: Property.ShortText({
      displayName: 'Currency Source (optional)',
      required: false,
      description: 'Source currency code. Use with Currency Target and Currency Rates.',
      placeholder: 'EUR',
    }),
    currencyTarget: Property.ShortText({
      displayName: 'Currency Target (optional)',
      required: false,
      description: 'Target currency code (e.g. `USD`). Used by the formatC formatter.',
    }),
    currencyRates: Property.Json({
      displayName: 'Currency Rates (optional)',
      required: false,
      description: 'Exchange rates object, for example `{"EUR": 1, "USD": 1.14}`.',
    }),
  },
  async run(context) {
    const { templateId, data, convertTo, converter, lang, timezone, reportName, complement, currencySource, currencyTarget, currencyRates } = context.propsValue;
    const id = carboneClient.readId({ value: templateId, label: 'Template ID' });
    const body = carboneClient.buildRenderBody({
      data: carboneClient.requireJsonData({ value: data, label: 'Data' }),
      convertTo,
      converter,
      lang,
      timezone,
      reportName,
      complement,
      currencySource,
      currencyTarget,
      currencyRates,
    });
    const response = await carboneClient.request<Buffer>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/render/${encodeURIComponent(id)}`,
      operation: 'render document',
      queryParams: { download: 'true' },
      body,
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeoutMs: carboneClient.RENDER_TIMEOUT_MS,
    });
    return carboneClient.saveFileResponse({
      response,
      fallbackName: `report-${Date.now()}`,
      writeFile: (params) => context.files.write(params),
    });
  },
});
