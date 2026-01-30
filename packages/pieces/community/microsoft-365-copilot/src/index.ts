import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { microsoft365CopilotAuth } from './lib/common/auth';
import { chatWithCopilot } from './lib/actions/chat-with-copilot';
import { retrieveGroundingData } from './lib/actions/retrieve-grounding-data';
import { copilotInteractionWebhook } from './lib/triggers/copilot-interaction-webhook';

export const microsoft365Copilot = createPiece({
  displayName: 'Microsoft 365 Copilot',
  auth: microsoft365CopilotAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-365-copilot.png',
  authors: ['sanket-a11y'],
  actions: [
    chatWithCopilot,
    retrieveGroundingData,
    createCustomApiCallAction({
      baseUrl: () => 'https://graph.microsoft.com/v1.0/',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [copilotInteractionWebhook],
});
