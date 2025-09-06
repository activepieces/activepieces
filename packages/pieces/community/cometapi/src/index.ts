import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askCometApiAction } from './lib/actions/ask-cometapi';
import { customApiCallAction } from './lib/actions/custom-api-call-smart';
import { cometApiAuth } from './lib/auth';

export const cometApi = createPiece({
  displayName: 'CometAPI',
  description:
    'Access multiple AI models through CometAPI - unified interface for GPT, Claude, Gemini, and more.',
  auth: cometApiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://raw.githubusercontent.com/cometapi-dev/.github/refs/heads/main/assets/cometapi_icon_256px.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['community'],
  actions: [askCometApiAction, customApiCallAction],
  triggers: [],
});

export { cometApiAuth };
