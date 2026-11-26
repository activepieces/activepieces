import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient, carboneOutputFields } from '../common/client';
import { carboneProps } from '../common/props';

export const renderInlineTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_render_inline_template',
  classification: 'WRITE',
  displayName: 'Render Template File',
  description: 'Render a template file with JSON data in one step, without storing the template in Carbone.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a template file (DOCX, XLSX, ODT, PPTX, HTML and other Carbone formats) together with a JSON data object and returns the generated document as a file; the template is not stored in Carbone. Use for one-off documents when no stored template ID exists; use Render Document for stored templates. Each call spends Carbone render credits. Not idempotent: every call generates and stores a new file.',
    idempotent: false,
  },
  outputSchema: { fields: carboneOutputFields.file },
  props: {
    template: Property.File({
      displayName: 'Template File',
      required: true,
      description: 'The template file (DOCX, XLSX, ODS, ODT, PPTX, HTML, ...).',
    }),
    data: Property.Json({
      displayName: 'Data (JSON)',
      required: true,
      description: 'JSON object whose keys match the `{d.}` tags in the template.',
    }),
    convertTo: carboneProps.convertTo(),
    lang: carboneProps.lang(),
    converter: carboneProps.converter(),
    timezone: carboneProps.timezone(),
    reportName: carboneProps.reportName(),
  },
  async run(context) {
    const { template, data, convertTo, converter, lang, timezone, reportName } = context.propsValue;
    const body = {
      ...carboneClient.buildRenderBody({
        data: carboneClient.requireJsonData({ value: data, label: 'Data' }),
        convertTo,
        converter,
        lang,
        timezone,
        reportName,
      }),
      template: template.base64,
    };
    const response = await carboneClient.request<Buffer>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/render/template',
      operation: 'render template file',
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
