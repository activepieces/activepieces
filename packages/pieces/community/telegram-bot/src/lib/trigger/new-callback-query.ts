import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

type TelegramUpdate = {
  update_id?: number;
  callback_query?: unknown;
};

type GetUpdatesResponse = {
  ok: boolean;
  result: TelegramUpdate[];
};

const getRecentCallbackQueries = async (botToken: string) => {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `https://api.telegram.org/bot${botToken}/getUpdates?allowed_updates=%5B%22callback_query%22%5D&offset=-20`,
  };
  const response = await httpClient.sendRequest<GetUpdatesResponse>(request);
  return (response.body.result ?? []).filter((update) => Boolean(update.callback_query));
};

export const telegramNewCallbackQuery = createTrigger({
  auth: telegramBotAuth,
  name: 'new_callback_query',
  displayName: 'New Callback Query',
  description:
    'Triggers when a user taps an inline-keyboard button on a message sent by this bot.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    update_id: 351114421,
    callback_query: {
      id: '3974162870792321998',
      from: {
        id: 55169542059,
        is_bot: false,
        first_name: 'Ada',
        last_name: 'Lovelace',
        username: 'ada',
        language_code: 'en',
      },
      message: {
        message_id: 42,
        chat: {
          id: 55169542059,
          type: 'private',
          first_name: 'Ada',
          last_name: 'Lovelace',
          username: 'ada',
        },
        date: 1716050152,
        text: 'Pick one:',
      },
      chat_instance: '-7384698451934859623',
      data: 'option_one',
    },
  },
  async onEnable(context) {
    await telegramCommons.subscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      { allowed_updates: ['callback_query'] }
    );
  },
  async onDisable(context) {
    await telegramCommons.unsubscribeWebhook(context.auth.secret_text);
  },
  async run(context) {
    const body = context.payload.body as TelegramUpdate | undefined;
    if (!body || !body.callback_query) {
      return [];
    }
    return [body];
  },
  async test(context) {
    return await getRecentCallbackQueries(context.auth.secret_text);
  },
});
