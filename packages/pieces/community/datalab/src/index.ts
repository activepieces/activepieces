import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { aiConvertDocumentAction } from './lib/actions/ai/convert-document';
import { aiExtractStructuredDataAction } from './lib/actions/ai/extract-structured-data';
import { aiFillFormAction } from './lib/actions/ai/fill-form';
import { aiGetFormFieldsAction } from './lib/actions/ai/get-form-fields';
import { aiSegmentDocumentAction } from './lib/actions/ai/segment-document';
import { convertDocumentAction } from './lib/actions/convert-document';
import { createDocumentAction } from './lib/actions/create-document';
import { extractStructuredDataAction } from './lib/actions/extract-structured-data';
import { fillFormAction } from './lib/actions/fill-form';
import { getFormFieldsAction } from './lib/actions/get-form-fields';
import { getResultAction } from './lib/actions/get-result';
import { segmentDocumentAction } from './lib/actions/segment-document';
import { datalabAuth } from './lib/auth';
import { datalabClient } from './lib/common/client';

export const datalab = createPiece({
  displayName: 'Datalab',
  description: 'Convert documents to Markdown, extract structured data, split files and fill forms.',
  auth: datalabAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/datalab.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.CONTENT_AND_FILES],
  authors: ['ibrahim-abuznaid'],
  actions: [
    convertDocumentAction,
    aiConvertDocumentAction,
    extractStructuredDataAction,
    aiExtractStructuredDataAction,
    segmentDocumentAction,
    aiSegmentDocumentAction,
    fillFormAction,
    aiFillFormAction,
    getFormFieldsAction,
    aiGetFormFieldsAction,
    createDocumentAction,
    getResultAction,
    createCustomApiCallAction({
      auth: datalabAuth,
      baseUrl: () => datalabClient.BASE_URL,
      authMapping: async (auth) => ({ 'X-API-Key': auth.secret_text }),
    }),
  ],
  triggers: [],
});
