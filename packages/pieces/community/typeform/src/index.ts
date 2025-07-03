import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { typeformNewSubmission } from './lib/trigger/new-submission';

export const typeformAuth = PieceAuth.OAuth2({
  required: true,
  tokenUrl: 'https://api.typeform.com/oauth/token',
  authUrl: 'https://admin.typeform.com/oauth/authorize',
  scope: ['webhooks:write', 'forms:read'],
});

export const typeform = createPiece({
  displayName: 'Typeform',
  description: 'Create beautiful online forms and surveys',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/typeform.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://api.typeform.com',
      auth: typeformAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  auth: typeformAuth,
  authors: ["ashrafsamhouri","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers: [typeformNewSubmission],
});
