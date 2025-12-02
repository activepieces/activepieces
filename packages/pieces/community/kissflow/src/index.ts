import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { kissflowAuth, KissflowAuth } from './auth';
import { downloadAttachmentFromFormField } from './lib/actions/download-attachment-from-form-field';

export const kissflow = createPiece({
  displayName: 'Kissflow',
  description: 'Low-code no-code platform',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: kissflowAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/kissflow.png',
  authors: ['danielpoonwj'],
  actions: [
    downloadAttachmentFromFormField,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        if (!auth) {
          return ''
        }
        const typedAuth = auth.props;
        return `https://${typedAuth.accountName}.${typedAuth.domainName}/process/2/${typedAuth.accountId}/`;
      },
      auth: kissflowAuth,
      authMapping: async (auth) => {
        const typedAuth = auth.props;
        return {
          'X-Access-Key-Id': typedAuth.accessKeyId,
          'X-Access-Key-Secret': typedAuth.accessKeySecret,
        };
      },
    }),
  ],
  triggers: [],
});
