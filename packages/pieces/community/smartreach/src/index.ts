import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createProspect } from './lib/actions/create-prospect';
import { getProspect } from './lib/actions/get-prospect';
import { updateProspect } from './lib/actions/update-prospect';

export const smartreachAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key from Smartreach settings. You can find it in Settings > API Keys.',
});

export const smartreach = createPiece({
  displayName: 'SmartReach',
  auth: smartreachAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/smartreach.png',
  authors: ['tarai-dl'],
  actions: [createProspect, getProspect, updateProspect],
  triggers: [],
});
