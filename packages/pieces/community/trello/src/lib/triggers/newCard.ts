import { trelloAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { trelloCommon } from '../common';
import { TrelloNewCard } from '../common/props/card';
import { isNil } from '@activepieces/shared';

export const newCardTrigger = createTrigger({
  auth: trelloAuth,
  name: 'new_card',
  displayName: 'New Card',
  description: 'Trigger when a new card is created',
  props: {
    board_id: trelloCommon.board_id,
    list_id_opt: trelloCommon.list_id_opt,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const element_id =
      context.propsValue.list_id_opt || context.propsValue.board_id;
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
    const body = context.payload.body as TrelloNewCard;
    if (body.action.display.translationKey !== 'action_create_card') {
      return [];
    }
    if (context.propsValue.list_id_opt) {
      if (
        body.action.display.entities.list.id !== context.propsValue.list_id_opt
      ) {
        return [];
      }
    }

    return [body];
  },
  async test(context) {
    const body = context.payload.body as TrelloNewCard;
    if (body.action.display.translationKey !== 'action_create_card') {
      return [];
    }
    // know check if the user chosen a list
    if (context.propsValue.list_id_opt) {
      if (
        body.action.display.entities.list.id !== context.propsValue.list_id_opt
      ) {
        return [];
      }
    }

    return [body];
  },
  sampleData: {},
});
