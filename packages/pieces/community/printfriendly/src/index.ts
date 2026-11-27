import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { printfriendlyAuth } from './lib/auth';
import { convertToDocument } from './lib/actions/convert-to-document';
import { getJob } from './lib/actions/get-job';
import { readPage } from './lib/actions/read-page';
import { printfriendlyApi } from './lib/common/client';

export const printfriendly = createPiece({
  displayName: 'PrintFriendly',
  description:
    'Convert web pages, HTML, or Markdown into clean PDF, Word, Markdown, HTML, JSON, or text documents.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/printfriendly.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
  auth: printfriendlyAuth,
  authors: ['Slim-Hady'],
  actions: [
    convertToDocument,
    readPage,
    getJob,
    createCustomApiCallAction({
      auth: printfriendlyAuth,
      baseUrl: () => printfriendlyApi.baseUrl,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
