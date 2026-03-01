import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { posthogCreateEvent } from './lib/actions/create-event';
import { posthogCreateProject } from './lib/actions/create-project';

const authenticationMarkdown = `
[Click here](https://posthog.com/docs/api/overview#personal-api-keys-recommended) to learn how to obtain your Personal API key.
`;

export const posthogAuth = PieceAuth.SecretText({
  displayName: 'Personal API Key',
  description: authenticationMarkdown,
  required: true,
});

export const posthog = createPiece({
  displayName: 'PostHog',
  description: 'Open-source product analytics',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/posthog.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: posthogAuth,
  actions: [
    posthogCreateEvent,
    posthogCreateProject,
    createCustomApiCallAction({
      baseUrl: () => 'https://app.posthog.com',
      auth: posthogAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers: [],
});
