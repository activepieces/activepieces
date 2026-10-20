import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { mindeeAuth } from './lib/auth';
import { MINDEE_V1_BASE_URL, MINDEE_V2_BASE_URL, isRecord, normalizeApiKey } from './lib/common/client';
import { getJobStatusAction, getResultAction } from './lib/actions/jobs';
import { listModelsAction } from './lib/actions/list-models';
import { mindeePredictDocumentAction } from './lib/actions/predict-document';
import { classifyDocumentAction, classifyDocumentAiAction } from './lib/actions/classify-document';
import { cropDocumentAction, cropDocumentAiAction } from './lib/actions/crop-document';
import { extractDocumentAction, extractDocumentAiAction } from './lib/actions/extract-document';
import { ocrDocumentAction, ocrDocumentAiAction } from './lib/actions/ocr-document';
import { splitDocumentAction, splitDocumentAiAction } from './lib/actions/split-document';
import {
  deleteRagDocumentAction,
  getRagDocumentAction,
  searchRagDocumentsAction,
  updateRagDocumentAction,
  uploadRagDocumentAction,
  uploadRagDocumentAiAction,
} from './lib/actions/rag-documents';

export const mindee = createPiece({
  displayName: 'Mindee',
  description: 'Document automation API',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/mindee.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  auth: mindeeAuth,
  actions: [
    extractDocumentAction,
    classifyDocumentAction,
    cropDocumentAction,
    ocrDocumentAction,
    splitDocumentAction,
    getJobStatusAction,
    getResultAction,
    listModelsAction,
    uploadRagDocumentAction,
    getRagDocumentAction,
    updateRagDocumentAction,
    deleteRagDocumentAction,
    searchRagDocumentsAction,
    mindeePredictDocumentAction,
    extractDocumentAiAction,
    classifyDocumentAiAction,
    cropDocumentAiAction,
    ocrDocumentAiAction,
    splitDocumentAiAction,
    uploadRagDocumentAiAction,
    createCustomApiCallAction({
      baseUrl: () => `${MINDEE_V2_BASE_URL}/v2`,
      auth: mindeeAuth,
      authMapping: async (auth, propsValue) => {
        const key = normalizeApiKey(auth.secret_text);
        return { Authorization: isLegacyUrl(propsValue) ? `Token ${key}` : key };
      },
    }),
  ],
  triggers: [],
});

function isLegacyUrl(propsValue: unknown): boolean {
  const urlProp = isRecord(propsValue) ? propsValue['url'] : undefined;
  const raw = isRecord(urlProp) ? urlProp['url'] : urlProp;
  return typeof raw === 'string' && raw.trim().startsWith(MINDEE_V1_BASE_URL.replace('/v1', ''));
}

export { mindeeAuth };
