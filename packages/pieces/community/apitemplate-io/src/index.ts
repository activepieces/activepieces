import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from './lib/common/auth';
import { createImage } from './lib/actions/create-image';
import { createPdf } from './lib/actions/create-pdf';
import { getAccountInformation } from './lib/actions/get-account-information';
import { deleteObject } from './lib/actions/delete-object';
import { listObjects } from './lib/actions/list-objects';
import { createPdfFromHtml } from './lib/actions/create-pdf-from-html';
import { createPdfFromUrl } from './lib/actions/create-pdf-from-url';

export const apitemplateIo = createPiece({
  displayName: 'Apitemplate-io',
  auth: ApitemplateAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/apitemplate-io.png',
  authors: ['Sanket6652'],
  actions: [
    createImage,
    createPdfFromHtml,
    createPdfFromUrl,
    createPdf,
    deleteObject,
    getAccountInformation,
    listObjects,
  ],
  triggers: [],
});
