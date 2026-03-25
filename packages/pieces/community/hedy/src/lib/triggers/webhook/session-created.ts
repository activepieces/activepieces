import { HedyWebhookEvent } from '../../common/types';
import { createHedyWebhookTrigger } from './factory';

export const sessionCreated = createHedyWebhookTrigger({
  event: HedyWebhookEvent.SessionCreated,
  name: 'session-created',
  displayName: 'Session Created',
  description: 'Triggers when a new session is created in Hedy.',
});
