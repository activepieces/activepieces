import { createPiece } from '@activepieces/pieces-framework';
import { oncehubAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { findContact } from './lib/actions/find-contact';
import { createContact } from './lib/actions/create-contact';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { contactCaptured } from './lib/triggers/contact-captured';

export const oncehub = createPiece({
  displayName: 'Oncehub',
  auth: oncehubAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/oncehub.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['sanket-a11y'],
  actions: [
    findContact,
    createContact,
    createCustomApiCallAction({
      auth: oncehubAuth,
      baseUrl: () => `https://api.oncehub.com/v2`,
      authMapping: async (auth) => ({
        'API-Key': `${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [contactCaptured],
});
