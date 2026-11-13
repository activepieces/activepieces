import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { mindeeAuth } from './lib/auth';
import { mindeeCustomApiCall } from './lib/actions/custom-api-call';
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
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'OdaiAhmed99'],
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
    mindeeCustomApiCall,
  ],
  triggers: [],
});

export { mindeeAuth };
