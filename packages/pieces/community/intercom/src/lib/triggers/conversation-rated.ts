import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { intercomClient } from '../common';

export const conversationRated = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'conversationRated',
  displayName: 'Conversation was rated',
  description:
    'Triggers when a conversation is rated',
  props: {},
  sampleData: {},
  auth: intercomAuth,
  type: TriggerStrategy.APP_WEBHOOK,
  async onEnable(context) {
    const client = intercomClient(context.auth);
    const response: { app: { id_code: string } } = await client.get({
      url: '/me',
    });
    context.app.createListeners({
      events: ['conversation.rating.added'],
      identifierValue: response['app']['id_code'],
    });
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    return [context.payload.body];
  },
});
