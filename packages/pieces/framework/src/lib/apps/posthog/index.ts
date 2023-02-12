import { createPiece } from '../../framework/piece';
import { posthogCreateEvent } from './actions/create-event';

export const posthog = createPiece({
  name: 'posthog',
  displayName: "PostHog",
  logoUrl: 'https://explore.zoom.us/media/logo-zoom-blue.svg',
  actions: [posthogCreateEvent],
  triggers: [],
});