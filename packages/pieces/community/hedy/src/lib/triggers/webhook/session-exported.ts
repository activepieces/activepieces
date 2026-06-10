import { HedyWebhookEvent } from '../../common/types';
import { createHedyWebhookTrigger } from './factory';

export const sessionExported = createHedyWebhookTrigger({
  event: HedyWebhookEvent.SessionExported,
  name: 'session-exported',
  displayName: 'Session Exported',
  description:
    'Triggers when a user manually exports a session via the app. Payload includes exportedAt instead of endTime.',
});
