import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createDraftAction } from './lib/actions/create-draft';
import { downloadSignedPdfAction } from './lib/actions/download-signed-pdf';
import { getDocumentAction } from './lib/actions/get-document';
import { sendDocumentAction } from './lib/actions/send-document';
import { inklyAuth } from './lib/auth';
import { inklyClient } from './lib/common/client';
import { documentCompletedTrigger } from './lib/triggers/document-completed';
import { documentSentTrigger } from './lib/triggers/document-sent';
import { signerSignedTrigger } from './lib/triggers/signer-signed';

export const inkly = createPiece({
  displayName: 'Inkly',
  description: 'Automate your eSignature and document signing workflows.',
  auth: inklyAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://www.inkly.so/brand/inkly-avatar-white-1024.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
  authors: ['jeevships'],
  actions: [
    sendDocumentAction,
    createDraftAction,
    getDocumentAction,
    downloadSignedPdfAction,
    createCustomApiCallAction({
      auth: inklyAuth,
      baseUrl: () => inklyClient.BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
        'Inkly-Client': inklyClient.CLIENT_NAME,
      }),
    }),
  ],
  triggers: [documentSentTrigger, signerSignedTrigger, documentCompletedTrigger],
});
