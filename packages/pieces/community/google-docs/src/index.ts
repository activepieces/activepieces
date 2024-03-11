import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { createDocument } from './lib/actions/create-document';
import { createDocumentBasedOnTemplate } from './lib/actions/create-document-based-on-template.action';
import { readDocument } from './lib/actions/read-document.action';

export const googleDocsAuth = PieceAuth.OAuth2({
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: ['https://www.googleapis.com/auth/documents'],
});

export const googleDocs = createPiece({
  displayName: 'Google Docs',
  description: 'Create and edit documents online',

  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-docs.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ["pfernandez98","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: googleDocsAuth,
  actions: [
    createDocument,
    createDocumentBasedOnTemplate,
    readDocument,
    createCustomApiCallAction({
      baseUrl: () => 'https://docs.googleapis.com/v1',
      auth: googleDocsAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
