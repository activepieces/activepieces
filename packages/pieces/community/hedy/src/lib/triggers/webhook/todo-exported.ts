import { HedyWebhookEvent } from '../../common/types';
import { createHedyWebhookTrigger } from './factory';

export const todoExported = createHedyWebhookTrigger({
  event: HedyWebhookEvent.TodoExported,
  name: 'todo-exported',
  displayName: 'Todo Exported',
  description: 'Triggers when a todo item is exported from Hedy.',
});
