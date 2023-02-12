import { createPiece } from '../../framework/piece';
import { posthogCreateEvent } from './actions/create-event';
import { posthogCreateProject } from './actions/create-project';

export const posthog = createPiece({
  name: 'posthog',
  displayName: "PostHog",
  logoUrl: 'https://posthog.com/brand/posthog-logomark.svg',
  actions: [posthogCreateEvent, posthogCreateProject],
  triggers: [],
});