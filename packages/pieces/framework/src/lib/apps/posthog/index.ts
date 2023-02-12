import { createPiece } from '../../framework/piece';
import { posthogCreateEvent } from './actions/create-event';
import { posthogCreateProject } from './actions/create-project';

export const posthog = createPiece({
  name: 'posthog',
  displayName: "PostHog",
  logoUrl: 'https://explore.zoom.us/media/logo-zoom-blue.svg',
  actions: [posthogCreateEvent, posthogCreateProject],
  triggers: [],
});