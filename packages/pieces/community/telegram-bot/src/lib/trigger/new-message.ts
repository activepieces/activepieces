import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

type TelegramUpdate = Record<string, unknown> & { update_id?: number };

type GetUpdatesResponse = {
  ok: boolean;
  result: TelegramUpdate[];
};

const UPDATE_TYPE_OPTIONS = [
  { label: 'Message', value: 'message' },
  { label: 'Edited Message', value: 'edited_message' },
  { label: 'Channel Post', value: 'channel_post' },
  { label: 'Edited Channel Post', value: 'edited_channel_post' },
  { label: 'Callback Query (inline button tap)', value: 'callback_query' },
  { label: 'Inline Query', value: 'inline_query' },
  { label: 'Chosen Inline Result', value: 'chosen_inline_result' },
  { label: 'Poll', value: 'poll' },
  { label: 'Poll Answer', value: 'poll_answer' },
  { label: 'My Chat Member', value: 'my_chat_member' },
  { label: 'Chat Member', value: 'chat_member' },
  { label: 'Chat Join Request', value: 'chat_join_request' },
];

const updateTypesDescription = `
Telegram allows only **one webhook per bot token**, so a single Telegram trigger handles all update types for a given bot. Pick the update types this flow should listen for. Leave empty to use Telegram's default set (messages, edited channel posts, chat-member updates — **does not include callback queries**).

After selecting multiple types, use a Branch step downstream to fork on the update kind (e.g. \`message\` vs \`callback_query\`).
`;

export const telegramNewMessage = createTrigger({
  auth: telegramBotAuth,
  name: 'new_telegram_message',
  displayName: 'New Update',
  description:
    'Triggers when the bot receives a Telegram update (message, callback query, poll answer, etc.). One trigger per bot token — Telegram does not support multiple webhooks on the same bot.',
  aiMetadata: { description: 'Fires when the bot receives any selected Telegram update, including new or edited messages, channel posts, inline-button callback queries, poll answers, and chat-member changes. Represents a single inbound update event; since Telegram allows only one webhook per bot token, this one trigger covers all chosen update types for that bot.' },
  props: {
    update_types: Property.StaticMultiSelectDropdown({
      displayName: 'Update Types',
      description: updateTypesDescription,
      required: false,
      options: { options: UPDATE_TYPE_OPTIONS },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    body: {
      message: {
        chat: {
          id: 55169542059,
          type: 'private',
          username: 'AbdallahAlwarawreh',
          last_name: 'Alwarawreh',
          first_name: 'Abdallah',
        },
        date: 1686050152,
        from: {
          id: 55169542059,
          is_bot: false,
          username: 'AbdallahAlwarawreh',
          last_name: 'Alwarawreh',
          first_name: 'Abdallah',
          language_code: 'en',
        },
        parse_mode: 'MarkdownV2',
        text: 'Hello world',
        message_id: 21,
      },
      update_id: 351114420,
    },
  },
  async onEnable(context) {
    const allowedUpdates = (context.propsValue.update_types ?? []) as string[];
    await telegramCommons.subscribeWebhook(context.auth.secret_text, context.webhookUrl, {
      allowed_updates: allowedUpdates,
    });
  },
  async onDisable(context) {
    await telegramCommons.unsubscribeWebhook(context.auth.secret_text);
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    const messages = await getLastFiveMessages(context.auth.secret_text);
    return messages.result;
  },
});

const getLastFiveMessages = async (botToken: string) => {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `https://api.telegram.org/bot${botToken}/getUpdates?offset=-5`,
  };
  const response = await httpClient.sendRequest<GetUpdatesResponse>(request);
  return response.body;
};
