import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { apitemplateAuth } from './lib/common/auth';
import { createImage } from './lib/actions/create-image';
import { createPdfFromTemplate } from './lib/actions/create-pdf-from-template';
import { createPdfFromHtml } from './lib/actions/create-pdf-from-html';
import { createPdfFromUrl } from './lib/actions/create-pdf-from-url';
import { createPdfAdvanced } from './lib/actions/create-pdf-advanced';
import { deleteObject } from './lib/actions/delete-object';
import { getAccountInfo } from './lib/actions/get-account-info';
import { listObjects } from './lib/actions/list-objects';
import { customApiCall } from './lib/actions/custom-api-call';

export const apitemplate = createPiece({
  displayName: 'APITemplate',
  description: 'Generate images and PDFs from templates using JSON overrides (supports dynamic elements such as QR codes)',
  auth: apitemplateAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/apitemplate.png',
  authors: ['mavrick'],
  categories: [PieceCategory.MARKETING, PieceCategory.CONTENT_AND_FILES],
  actions: [
    createImage,
    createPdfFromTemplate,
    createPdfFromHtml,
    createPdfFromUrl,
    createPdfAdvanced,
    deleteObject,
    getAccountInfo,
    listObjects,
    customApiCall,
  ],
  triggers: [],
});