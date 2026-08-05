import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

type TelegramUpdate = Record<string, unknown> & { update_id?: number };

type GetUpdatesResponse = {
  ok: boolean;
  result: TelegramUpdate[];
};

type GetWebhookInfoResponse = {
  ok: boolean;
  result: {
    url: string;
  };
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

const updateTypesDescription = 'Which update types this flow should listen for. Leave empty for Telegram\'s default set (does not include callback queries).';

const triggerNotesDescription = `
Telegram allows only **one webhook per bot token**, so this one trigger covers every update type picked below. Use a Branch step downstream to fork on update kind (e.g. \`message\` vs \`callback_query\`).

Same reason **Retest** shows example data instead of a live update once this flow is published, refetching would mean hijacking the bot's active webhook. Test before publishing to capture a real message.
`;

const SAMPLE_UPDATE: TelegramUpdate = {
  update_id: 351114420,
  message: {
    chat: {
      id: 123456789,
      type: 'private',
      username: 'johndoe',
      last_name: 'Doe',
      first_name: 'John',
    },
    date: 1686050152,
    from: {
      id: 123456789,
      is_bot: false,
      username: 'johndoe',
      last_name: 'Doe',
      first_name: 'John',
      language_code: 'en',
    },
    parse_mode: 'MarkdownV2',
    text: 'Hello world',
    message_id: 21,
  },
};

export const telegramNewMessage = createTrigger({
  auth: telegramBotAuth,
  name: 'new_telegram_message',
  displayName: 'New Update',
  description:
    'Triggers when the bot receives a Telegram update (message, callback query, poll answer, etc.).',
  aiMetadata: { description: 'Fires when the bot receives any selected Telegram update, including new or edited messages, channel posts, inline-button callback queries, poll answers, and chat-member changes. Represents a single inbound update event; since Telegram allows only one webhook per bot token, this one trigger covers all chosen update types for that bot.' },
  props: {
    trigger_notes: Property.MarkDown({
      value: triggerNotesDescription,
    }),
    update_types: Property.StaticMultiSelectDropdown({
      displayName: 'Update Types',
      description: updateTypesDescription,
      required: false,
      options: { options: UPDATE_TYPE_OPTIONS },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: SAMPLE_UPDATE,
  async onEnable(context) {
    const allowedUpdates = (context.propsValue.update_types ?? []) as string[];
    await telegramCommons.subscribeWebhook(context.auth.secret_text, context.webhookUrl, {
      allowed_updates: allowedUpdates,
      drop_pending_updates: true,
    });
  },
  async onDisable(context) {
    await telegramCommons.unsubscribeWebhook(context.auth.secret_text);
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    const webhookInfo = await getWebhookInfo(context.auth.secret_text);
    if (webhookInfo.result.url) {
      return [SAMPLE_UPDATE];
    }
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

const getWebhookInfo = async (botToken: string) => {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `https://api.telegram.org/bot${botToken}/getWebhookInfo`,
  };
  const response = await httpClient.sendRequest<GetWebhookInfoResponse>(request);
  return response.body;
};
