import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { gravityFormsAiActions } from './lib/actions/ai';
import { gravityFormsAuth } from './lib/auth';
import { gravityFormsClient } from './lib/common/client';
import { newSubmissionTrigger } from './lib/triggers/new-submission';

export const gravityforms = createPiece({
  displayName: 'Gravity Forms',
  description: 'Build and publish your WordPress forms',

  auth: gravityFormsAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/gravityforms.svg',
  authors: ["Abdallah-Alwarawreh","kishanprmr","MoShizzle","abuaboud"],
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  actions: [
    ...gravityFormsAiActions,
    createCustomApiCallAction({
      auth: gravityFormsAuth,
      baseUrl: (auth) => (auth ? gravityFormsClient.baseUrl({ auth }) : ''),
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(`${auth.props.consumerKey}:${auth.props.consumerSecret}`).toString('base64')}`,
      }),
    }),
  ],
  triggers: [newSubmissionTrigger],
});
