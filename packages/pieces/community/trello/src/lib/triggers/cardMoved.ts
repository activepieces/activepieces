import { trelloAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { trelloCommon } from '../common';
import { TrelloCardMoved } from '../common/props/card';
import { isNil } from '@activepieces/shared';

export const cardMovedTrigger = createTrigger({
  auth: trelloAuth,
  name: 'card_moved_to_list',
  displayName: 'Card Moved to list',
  description: 'Trigger when a card is moved to the list specified',
  props: {
    board_id: trelloCommon.board_id,
    list_id: trelloCommon.list_id,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const element_id = context.propsValue.list_id;
    const webhooks = await trelloCommon.list_webhooks(context.auth);
    const webhook = webhooks.find(
      (webhook) =>
        webhook.idModel === element_id &&
        webhook.callbackURL === context.webhookUrl
    );
    if (webhook) {
      context.webhookUrl = webhook.callbackURL;
      return;
    }
    const response = await trelloCommon.create_webhook(
      context.auth,
      element_id,
      context.webhookUrl
    );
    await context.store.put('webhook_id', response.id);
  },
  async onDisable(context) {
    const webhook_id = (await context.store.get('webhook_id')) as string;
    if (isNil(webhook_id)) {
      return;
    }
    const webhooks = await trelloCommon.list_webhooks(context.auth);
    const webhook = webhooks.find(
      (webhook) => webhook.callbackURL === context.webhookUrl
    );
    if (!webhook) {
      return;
    }
    await trelloCommon.delete_webhook(context.auth, webhook_id);
  },
  async run(context) {
    const response = context.payload.body as TrelloCardMoved;
    const response_body = response.action.display;
    if (
      response.action.display.translationKey !==
      'action_move_card_from_list_to_list'
    ) {
      return [];
    }
    if (response_body.entities.listAfter.id !== context.propsValue.list_id) {
      return [];
    }
    if (response_body.entities.listBefore.id === context.propsValue.list_id) {
      return [];
    }
    return [response_body];
  },
  async test(context) {
    const response = context.payload.body as TrelloCardMoved;
    const response_body = response.action.display;
    if (
      response.action.display.translationKey !==
      'action_move_card_from_list_to_list'
    ) {
      return [];
    }
    if (response_body.entities.listAfter.id !== context.propsValue.list_id) {
      return [];
    }
    if (response_body.entities.listBefore.id === context.propsValue.list_id) {
      return [];
    }
    return [response_body];
  },
  sampleData: {},
});
