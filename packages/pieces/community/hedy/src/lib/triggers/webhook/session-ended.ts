import { HedyWebhookEvent } from '../../common/types';
import { createHedyWebhookTrigger } from './factory';

export const sessionEnded = createHedyWebhookTrigger({
  event: HedyWebhookEvent.SessionEnded,
  name: 'session-ended',
  displayName: 'Session Ended',
  description: 'Triggers when a session is completed in Hedy.',
});
