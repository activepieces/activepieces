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
