import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendMessage } from './lib/actions/send-message';
import { getApiEndpoint } from './utilities';

export const returningAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Add api key from returning.ai',
});

export const returningAi = createPiece({
  displayName: 'Returning AI',
  auth: returningAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: `${getApiEndpoint()}/logo.png`,
  authors: [],
  actions: [sendMessage],
  triggers: [],
});
