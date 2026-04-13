import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { tallyFormsNewSubmission } from './lib/triggers/new-submission';

export const tallyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Tally API key. Go to **Settings > API keys** in your Tally dashboard to create one.',
  required: true,
});

export const tally = createPiece({
  displayName: 'Tally',
  description: 'Receive form submissions from Tally forms',
  auth: tallyAuth,
  minimumSupportedRelease: '0.27.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/tally.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ['kishanprmr', 'abuaboud','bst1n'],
  actions: [],
  triggers: [tallyFormsNewSubmission],
});
