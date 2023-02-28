import { createPiece } from '@activepieces/framework';
import { posthogCreateEvent } from './lib/actions/create-event';
import { posthogCreateProject } from './lib/actions/create-project';

export const posthog = createPiece({
  name: 'posthog',
  displayName: "PostHog",
  logoUrl: 'https://cdn.activepieces.com/pieces/posthog.png',
  actions: [posthogCreateEvent, posthogCreateProject],
  authors: ['kanarelo'],
  triggers: [],
  version: '0.0.0',
});
