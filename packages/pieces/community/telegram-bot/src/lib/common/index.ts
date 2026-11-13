import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { telegramBotAuth } from '../..';
import {
  AppConnectionValueForAuthProperty,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';

const chatIdInstructions = `
**How to obtain Chat ID:**
1. Search for the bot "@getmyid_bot" in Telegram.
2. Start a conversation with the bot.
3. Send the command "/my_id" to the bot.
4. The bot will reply with your chat ID.

**Note: Remember to initiate the chat with the bot, or you'll get an error for "chat not found."**
`;

const formatLinkMarkdown = `
[Formatting options](https://core.telegram.org/bots/api#formatting-options)
`;

const buildChatIdInstructions = () =>
  Property.MarkDown({ value: chatIdInstructions });

const buildFormatLinkInstructions = () =>
  Property.MarkDown({ value: formatLinkMarkdown });

const buildChatIdProp = () =>
  Property.ShortText({
    displayName: 'Chat Id',
    description:
      'Unique identifier for the target chat or username of the target channel (e.g. @channelusername).',
    required: true,
  });

const buildMessageThreadIdProp = () =>
  Property.ShortText({
    displayName: 'Message Thread Id',
    description:
      'Unique identifier for the target message thread of the forum; supergroup forums only.',
    required: false,
  });

const buildParseModeProp = () =>
  Property.StaticDropdown({
    displayName: 'Format',
    description: 'How the message text should be parsed by Telegram.',
    required: false,
    options: {
      options: [
        { label: 'Markdown (V2)', value: 'MarkdownV2' },
        { label: 'HTML', value: 'HTML' },
        { label: 'Plain Text', value: 'None' },
      ],
    },
    defaultValue: 'MarkdownV2',
  });

const buildReplyMarkupProp = () =>
  Property.Json({
    required: false,
    displayName: 'Reply Markup',
    description:
      'Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user.',
  });

const buildDisableNotificationProp = () =>
  Property.Checkbox({
    displayName: 'Disable Notification',
    description: 'Send the message silently. Users will receive a notification with no sound.',
    required: false,
    defaultValue: false,
  });

const buildProtectContentProp = () =>
  Property.Checkbox({
    displayName: 'Protect Content',
    description: 'Protects the contents of the sent message from forwarding and saving.',
    required: false,
    defaultValue: false,
  });

const buildReplyToMessageIdProp = () =>
  Property.Number({
    displayName: 'Reply To Message Id',
    description: 'If the message is a reply, ID of the original message.',
    required: false,
  });

const formChatIdInstructions = `Your own chat ID: message @getmyid_bot and send /my_id. A group's ID: add your bot, send /start there, test the New Update trigger before publishing and copy chat.id from that message, not the 123456789 sample. A public channel can use its @username.

The bot must be in the group or channel, or the person must have messaged it first, or Telegram answers "chat not found".`;

const formFormatLinkMarkdown =
  "[Telegram's formatting guide](https://core.telegram.org/bots/api#formatting-options) lists every tag. MarkdownV2 needs a backslash before symbols like . ! - ( ), or Telegram rejects the message.";

const formChatIdPlaceholder = '123456789 or @channelname';

const formMessageIdDescription =
  'From the output of the step that sent it, or the trigger.';

const buildFormChatIdInstructions = () =>
  Property.MarkDown({
    value: formChatIdInstructions,
    variant: MarkdownVariant.INFO,
  });

const buildFormChatIdProp = ({
  placeholder = formChatIdPlaceholder,
}: { placeholder?: string } = {}) =>
  Property.ShortText({
    displayName: 'Chat ID',
    description: 'Numeric chat ID, or @username for a public channel.',
    placeholder,
    required: true,
  });

const buildFormMessageThreadIdProp = () =>
  Property.ShortText({
    displayName: 'Topic ID',
    description:
      'Post inside a topic of a forum group. Empty posts to the main chat.',
    required: false,
    advanced: true,
  });

const buildFormParseModeProp = ({
  displayName = 'Format',
  description = 'How Telegram styles the text.',
}: { displayName?: string; description?: string } = {}) =>
  Property.StaticDropdown({
    displayName,
    description,
    required: false,
    display: 'cards',
    options: {
      options: [
        {
          label: 'MarkdownV2',
          value: 'MarkdownV2',
          icon: 'markdown',
        },
        {
          label: 'HTML',
          value: 'HTML',
          icon: 'code',
        },
        {
          label: 'Plain Text',
          value: 'None',
          icon: 'text',
        },
      ],
    },
    defaultValue: 'MarkdownV2',
  });

const buildFormFormatLinkInstructions = () =>
  Property.MarkDown({
    value: formFormatLinkMarkdown,
    variant: MarkdownVariant.BORDERLESS,
  });

const buildFormReplyMarkupProp = () =>
  Property.Json({
    displayName: 'Buttons',
    description:
      'reply_markup JSON: an inline keyboard, reply keyboard or forced reply.',
    required: false,
    advanced: true,
  });

const buildFormDisableNotificationProp = ({
  description = 'Deliver without a sound. The message still arrives.',
}: { description?: string } = {}) =>
  Property.Checkbox({
    displayName: 'Disable Notification',
    description,
    required: false,
    defaultValue: false,
    advanced: true,
  });

const buildFormProtectContentProp = () =>
  Property.Checkbox({
    displayName: 'Protect Content',
    description: 'Stop recipients from forwarding or saving the message.',
    required: false,
    defaultValue: false,
    advanced: true,
  });

const buildFormReplyToMessageIdProp = () =>
  Property.Number({
    displayName: 'Reply To Message ID',
    description: 'Send as a reply to this message in the same chat.',
    required: false,
    advanced: true,
  });

const buildFormLinkPreviewProp = () =>
  Property.Checkbox({
    displayName: 'Disable Link Preview',
    description: "Don't show a preview card for links in the message.",
    required: false,
    defaultValue: false,
    advanced: true,
  });

const resolveParseMode = (value: string | undefined): string | undefined => {
  if (!value || value === 'None') {
    return undefined;
  }
  return value;
};

export type SetWebhookRequest = {
  ip_address: string;
  max_connections: number;
  allowed_updates: string[];
  drop_pending_updates: boolean;
  secret_token: string;
};

export const telegramCommons = {
  getApiUrl: (auth: AppConnectionValueForAuthProperty<typeof telegramBotAuth>, methodName: string) => {
    return `https://api.telegram.org/bot${auth.secret_text}/${methodName}`;
  },
  subscribeWebhook: async (
    botToken: string,
    webhookUrl: string,
    overrides?: Partial<SetWebhookRequest>
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.telegram.org/bot${botToken}/setWebhook`,
      body: {
        allowed_updates: [],
        url: webhookUrl,
        ...overrides,
      },
    };

    await httpClient.sendRequest(request);
  },
  unsubscribeWebhook: async (botToken: string) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.telegram.org/bot${botToken}/deleteWebhook`,
    };
    return await httpClient.sendRequest(request);
  },
  chatIdInstructions: buildChatIdInstructions,
  formatLinkInstructions: buildFormatLinkInstructions,
  chatIdProp: buildChatIdProp,
  messageThreadIdProp: buildMessageThreadIdProp,
  parseModeProp: buildParseModeProp,
  replyMarkupProp: buildReplyMarkupProp,
  disableNotificationProp: buildDisableNotificationProp,
  protectContentProp: buildProtectContentProp,
  replyToMessageIdProp: buildReplyToMessageIdProp,
  resolveParseMode,
  form: {
    chatIdInstructions: buildFormChatIdInstructions,
    chatIdProp: buildFormChatIdProp,
    messageThreadIdProp: buildFormMessageThreadIdProp,
    parseModeProp: buildFormParseModeProp,
    formatLinkInstructions: buildFormFormatLinkInstructions,
    replyMarkupProp: buildFormReplyMarkupProp,
    disableNotificationProp: buildFormDisableNotificationProp,
    protectContentProp: buildFormProtectContentProp,
    replyToMessageIdProp: buildFormReplyToMessageIdProp,
    linkPreviewProp: buildFormLinkPreviewProp,
    messageIdDescription: formMessageIdDescription,
  },
};
