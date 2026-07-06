import { HedyWebhookEvent } from '../../common/types';
import { createHedyWebhookTrigger } from './factory';

export const sessionExported = createHedyWebhookTrigger({
  event: HedyWebhookEvent.SessionExported,
  name: 'session-exported',
  displayName: 'Session Exported',
  description:
    'Triggers when a user manually exports a session via the app. Payload includes exportedAt instead of endTime.',
  aiMetadata: {
    description: 'Fires when a user manually exports a Hedy session from the app, representing a deliberate export action (distinct from a session simply ending). The payload carries an exportedAt timestamp in place of endTime.',
  },
});
