import { createPiece } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from './lib/common/auth';
import { createImage } from './lib/actions/create-image';
import { createPdf } from './lib/actions/create-pdf';
import { getAccountInformation } from './lib/actions/get-account-information';
import { deleteObject } from './lib/actions/delete-object';
import { listObjects } from './lib/actions/list-objects';
import { createPdfFromHtml } from './lib/actions/create-pdf-from-html';
import { createPdfFromUrl } from './lib/actions/create-pdf-from-url';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { ApitemplateAuthConfig, getRegionalBaseUrl } from './lib/common/client';

export const apitemplateIo = createPiece({
  displayName: 'APITemplate.io',
  auth: ApitemplateAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/apitemplate-io.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
  authors: ['Sanket6652'],
  actions: [
    createImage,
    createPdfFromHtml,
    createPdfFromUrl,
    createPdf,
    deleteObject,
    getAccountInformation,
    listObjects,
    createCustomApiCallAction({
      auth: ApitemplateAuth,
      baseUrl: (auth) => {
        const authConfig = auth as ApitemplateAuthConfig;
        return getRegionalBaseUrl(authConfig.region);
      },
      authMapping: async (auth) => {
        const authConfig = auth as ApitemplateAuthConfig;
        return {
          'X-API-KEY': authConfig.apiKey,
        };
      },
    }),
  ],
  triggers: [],
});
