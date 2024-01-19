import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
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
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/posthog.png',
  auth: posthogAuth,
  actions: [posthogCreateEvent, posthogCreateProject],
  authors: ['kanarelo'],
  triggers: [],
});
