import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { customApiCallAction } from './lib/actions/custom-api-call';

export const smarterProctoringAuth = PieceAuth.CustomAuth({
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your SmarterProctoring API key.',
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      description: 'The base URL of your SmarterProctoring instance (including protocol).',
      defaultValue: 'https://api.smarterproctoring.com',
    }),
  },
  required: true,
});

export const smarterproctoring = createPiece({
  displayName: "SmarterProctoring",
  auth: smarterProctoringAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/smarterproctoring.png",
  authors: [
    'SmarterService'
  ],
  categories: [
    PieceCategory.PRODUCTIVITY,
    PieceCategory.BUSINESS_INTELLIGENCE
  ],
  description: 'Online proctoring and exam management platform',
  actions: [customApiCallAction],
  triggers: [],
});
