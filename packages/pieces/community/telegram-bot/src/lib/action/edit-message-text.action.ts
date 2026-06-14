import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramEditMessageTextAction = createAction({
  auth: telegramBotAuth,
  name: 'edit_message_text',
  displayName: 'Edit Message Text',
  description: 'Edit the text of a previously sent message or an inline message',
  audience: 'both',
  aiMetadata: { description: 'Replaces the text of a message the bot already sent, identified either by chat_id + message_id or by inline_message_id (the two targeting modes are mutually exclusive). Use to update a status or correct a message in place rather than sending a new one. Not idempotent: Telegram rejects an edit whose text matches the current content.', idempotent: false },
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: Property.ShortText({
      displayName: 'Chat Id',
      description:
        'Required when editing a message sent by the bot. Leave empty to edit an inline message (use Inline Message Id instead).',
      required: false,
    }),
    message_id: Property.Number({
      displayName: 'Message Id',
      description: 'Identifier of the message to edit (used together with Chat Id).',
      required: false,
    }),
    inline_message_id: Property.ShortText({
      displayName: 'Inline Message Id',
      description: 'Identifier of the inline message (mutually exclusive with Chat Id + Message Id).',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'New Text',
      description: 'New text of the message (1–4096 chars).',
      required: true,
    }),
    format: telegramCommons.parseModeProp(),
    instructions_format: telegramCommons.formatLinkInstructions(),
    disable_web_page_preview: Property.Checkbox({
      displayName: 'Disable Web Page Preview',
      description: 'Disable link previews for links in this message.',
      required: false,
      defaultValue: false,
    }),
    reply_markup: telegramCommons.replyMarkupProp(),
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
