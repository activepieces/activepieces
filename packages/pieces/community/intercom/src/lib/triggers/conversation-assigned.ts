import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { intercomClient } from '../common';

export const conversationAssigned = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'conversationAssigned',
  displayName: 'Conversation assigned to any Intercom admin',
  description:
    'Triggers when a conversation is assigned to an admin',
  props: {},
  sampleData: undefined,
  auth: intercomAuth,
  type: TriggerStrategy.APP_WEBHOOK,
  async onEnable(context) {
    const client = intercomClient(context.auth);
    const response: { app: { id_code: string } } = await client.get({
      url: '/me',
    });
    context.app.createListeners({
      events: ['conversation.admin.assigned'],
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
