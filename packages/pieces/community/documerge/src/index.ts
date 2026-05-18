import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { documergeAuth } from './lib/common/auth';
import { combineFiles } from './lib/actions/combine-files';
import { convertFileToPdf } from './lib/actions/convert-file-to-pdf';
import { createDataRouteMerge } from './lib/actions/create-data-route-merge';
import { createDocumentMerge } from './lib/actions/create-document-merge';
import { splitPdf } from './lib/actions/split-pdf';
import { newMergedDocument } from './lib/triggers/new-merged-document';
import { newMergedRoute } from './lib/triggers/new-merged-route';

export const documerge = createPiece({
  displayName: 'DocuMerge',
  description: 'Merge and generate documents with dynamic data',
  auth: documergeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/documerge.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['onyedikachi-david'],
  actions: [combineFiles, convertFileToPdf, createDataRouteMerge, createDocumentMerge, splitPdf],
  triggers: [newMergedDocument, newMergedRoute],
});