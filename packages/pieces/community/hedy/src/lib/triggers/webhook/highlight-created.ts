import { HedyWebhookEvent } from '../../common/types';
import { createHedyWebhookTrigger } from './factory';

export const highlightCreated = createHedyWebhookTrigger({
  event: HedyWebhookEvent.HighlightCreated,
  name: 'highlight-created',
  displayName: 'Highlight Created',
  description: 'Triggers when a highlight is created during a session.',
});
