import { HedyWebhookEvent } from '../../common/types';
import { createHedyWebhookTrigger } from './factory';

export const sessionEnded = createHedyWebhookTrigger({
  event: HedyWebhookEvent.SessionEnded,
  name: 'session-ended',
  displayName: 'Session Ended',
  description: 'Triggers when a session is completed in Hedy.',
  aiMetadata: {
    description: 'Fires when a Hedy meeting session is completed (ended), representing a finished session whose transcript and AI-generated outputs are available. Use this rather than Session Created when you need the full results of a meeting.',
  },
});
