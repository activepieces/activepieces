import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient, carboneOutputFields } from '../common/client';
import { carboneProps } from '../common/props';

export const convertDocumentAction = createAction({
  auth: carboneAuth,
  name: 'carbone_convert_document',
  classification: 'WRITE',
  displayName: 'Convert Document',
  description: 'Convert a document to another format (for example DOCX to PDF) with Carbone.',
  audience: 'both',
  aiMetadata: {
    description: 'Converts a document file (DOCX, XLSX, PPTX, ODT, HTML and other Carbone formats) to another format such as PDF and returns the converted file. The file is sent without data, so Carbone only converts it and leaves any `{d.}` tags as they are; nothing is stored in Carbone. Each call spends Carbone render credits. Not idempotent: every call generates and stores a new file.',
    idempotent: false,
  },
  outputSchema: { fields: carboneOutputFields.file },
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
      description: 'The document to convert.',
    }),
    convertTo: Property.ShortText({
      displayName: 'Convert To',
      required: true,
      defaultValue: 'pdf',
      description: 'Target format, or a JSON object with formatName and formatOptions.',
      placeholder: 'pdf',
    }),
    converter: carboneProps.converter(),
  },
  async run(context) {
    const { file, convertTo, converter } = context.propsValue;
    const parsedConvertTo = carboneClient.parseConvertTo(convertTo);
    if (parsedConvertTo === undefined) {
      throw new Error('Convert To is required, for example "pdf".');
    }
    const body: Record<string, unknown> = {
      template: file.base64,
      convertTo: parsedConvertTo,
    };
    if (converter) body['converter'] = converter;
    const response = await carboneClient.request<Buffer>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/render/template',
      operation: 'convert document',
      queryParams: { download: 'true' },
      body,
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeoutMs: carboneClient.RENDER_TIMEOUT_MS,
    });
    return carboneClient.saveFileResponse({
      response,
      fallbackName: `converted-${Date.now()}`,
      writeFile: (params) => context.files.write(params),
    });
  },
});
