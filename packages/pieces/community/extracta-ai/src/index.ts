import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { extractFileData } from './lib/actions/extract-file-data';
import { getExtractionResults } from './lib/actions/get-extraction-results';
import { uploadFile } from './lib/actions/upload-file';
import { extractionFailed } from './lib/triggers/extraction-failed';
import { newDocumentProcessed } from './lib/triggers/new-document-processed';

export const extractaAi = createPiece({
  displayName: 'Extracta-ai',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/extracta-ai.png',
  authors: ['LuizDMM'],
  actions: [extractFileData, uploadFile, getExtractionResults],
  triggers: [newDocumentProcessed, extractionFailed],
});
