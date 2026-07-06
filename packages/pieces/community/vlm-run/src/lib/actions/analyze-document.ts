import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vlmRunAuth, vlmRunCommon } from '../common';
import { analyzeDocumentProperties } from '../common/properties';
import { analyzeDocumentSchema } from '../common/schemas';

export const analyzeDocument = createAction({
  auth: vlmRunAuth,
  name: 'analyzeDocument',
  displayName: 'Analyze Document',
  description:
    'Process a document (PDF, DOCX, etc.), extracting structured data or text.',
  audience: 'both',
  aiMetadata: { description: 'Extract structured data or text from a document with VLM Run; uploads the file then runs a prediction in a chosen domain that switches the parsing schema (invoice, receipt, resume, bank statement, utility bill, US driver license, markdown, generic classification, or document Q&A). Choose this to turn PDFs/DOCX and similar files into structured fields. The domain input is required and determines the output fields; each call launches a new prediction job and polls until complete, so it is not idempotent.', idempotent: false },
  props: analyzeDocumentProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, analyzeDocumentSchema);

    const { document, domain } = propsValue;

    const uploadResponse = await vlmRunCommon.uploadFile({
      apiKey:apiKey.secret_text,
      file: document,
    });

    const response = await vlmRunCommon.analyzeDocument({
      apiKey:apiKey.secret_text,
      file_id: uploadResponse.id,
      domain,
    });

    return await vlmRunCommon.getresponse(apiKey.secret_text, response.id, response.status);
  },
});
