import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramEditMessageText = createAction({
  auth: telegramBotAuth,
  name: 'telegram_edit_message_text',
  displayName: 'Edit Message Text',
  description: 'Edit the text of a message the bot already sent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replaces the text of a message the bot already sent, targeted by chat_id + message_id OR by inline_message_id (the two modes are mutually exclusive — resolve message_id from the send action\'s return or the New Message trigger payload). Use to update a status or correct a message in place instead of sending a new one. Text is sent as plain text unless format is set; if you set MarkdownV2 or HTML the text must be correctly escaped or Telegram rejects it. Idempotent in effect (the message ends at the given text), but Telegram rejects an edit whose new text matches the current content.',
    idempotent: true,
  },
  props: {
    chat_id: Property.ShortText({
      displayName: 'Chat Id',
      description:
        'Numeric id or @channelusername of the chat holding the message. Required together with Message Id; leave empty when editing an inline message (use Inline Message Id instead).',
      required: false,
    }),
    message_id: Property.ShortText({
      displayName: 'Message Id',
      description: 'Identifier of the message to edit (used together with Chat Id).',
      required: false,
    }),
    inline_message_id: Property.ShortText({
      displayName: 'Inline Message Id',
      description:
        'Identifier of the inline message (mutually exclusive with Chat Id + Message Id).',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'New Text',
      description: 'New text of the message (1–4096 chars).',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description:
        'How the message text should be parsed by Telegram. Defaults to plain text; only set MarkdownV2 or HTML when the text is correctly escaped/tagged.',
      required: false,
      options: {
        options: [
          { label: 'Plain Text', value: 'None' },
          { label: 'Markdown (V2)', value: 'MarkdownV2' },
          { label: 'HTML', value: 'HTML' },
        ],
      },
      defaultValue: 'None',
    }),
    disable_web_page_preview: Property.Checkbox({
      displayName: 'Disable Web Page Preview',
      description: 'Disable link previews for links in this message.',
      required: false,
      defaultValue: false,
    }),
    reply_markup: Property.Json({
      displayName: 'Reply Markup',
      description:
        'Advanced/optional. A raw JSON-serialized inline keyboard, e.g. {"inline_keyboard":[[{"text":"Open","url":"https://example.com"}]]}. Malformed markup is rejected by Telegram.',
      required: false,
    }),
  },
  async run(ctx) {
    const hasChatTarget = Boolean(ctx.propsValue.chat_id && ctx.propsValue.message_id);
    const hasInlineTarget = Boolean(ctx.propsValue.inline_message_id);
    if (!hasChatTarget && !hasInlineTarget) {
      throw new Error(
        'Either Chat Id + Message Id, or Inline Message Id, must be provided.'
      );
    }

    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'editMessageText'),
      body: {
        chat_id: ctx.propsValue.chat_id ?? undefined,
        message_id: ctx.propsValue.message_id ?? undefined,
        inline_message_id: ctx.propsValue.inline_message_id ?? undefined,
        text: ctx.propsValue.text,
        parse_mode: telegramCommons.resolveParseMode(ctx.propsValue.format),
        disable_web_page_preview: ctx.propsValue.disable_web_page_preview ?? false,
        reply_markup: ctx.propsValue.reply_markup ?? undefined,
      },
    });
  },
});
