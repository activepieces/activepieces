import { HedyWebhookEvent } from '../../common/types';
import { createHedyWebhookTrigger } from './factory';

export const highlightCreated = createHedyWebhookTrigger({
  event: HedyWebhookEvent.HighlightCreated,
  name: 'highlight-created',
  displayName: 'Highlight Created',
  description: 'Triggers when a highlight is created during a session.',
  aiMetadata: {
    description: 'Fires when a highlight is captured during a Hedy session, representing a single newly created highlight and its parent session. Use to react to highlights as they happen mid-meeting.',
  },
});
