import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { editMessageTextActionOutputSchema } from '../output-schemas';

export const telegramEditMessageTextAction = createAction({
  auth: telegramBotAuth,
  name: 'edit_message_text',
  classification: 'WRITE',
  displayName: 'Edit Message Text',
  description: 'Replace the text of a message the bot sent.',
  audience: 'human',
  aiMetadata: { description: 'Replaces the text of a message the bot already sent, identified either by chat_id + message_id or by inline_message_id (the two targeting modes are mutually exclusive). Use to update a status or correct a message in place rather than sending a new one. Not idempotent: Telegram rejects an edit whose text matches the current content.', idempotent: false },
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Message to Edit',
      icon: 'inbox',
      props: [
        'target_info',
        'instructions',
        'chat_id',
        'message_id',
        'inline_message_id',
      ],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['format', 'text', 'instructions_format'],
    },
  ],
  props: {
    target_info: Property.MarkDown({
      value: 'Fill Chat ID and Message ID together, or Inline Message ID alone.',
      variant: MarkdownVariant.INFO,
    }),
    instructions: telegramCommons.form.chatIdInstructions(),
    chat_id: Property.ShortText({
      displayName: 'Chat ID',
      description: 'Numeric chat ID, or @username for a public channel.',
      placeholder: '123456789 or @channelname',
      required: false,
    }),
    message_id: Property.Number({
      displayName: 'Message ID',
      description: telegramCommons.form.messageIdDescription,
      required: false,
    }),
    inline_message_id: Property.ShortText({
      displayName: 'Inline Message ID',
      description:
        'For messages sent in inline mode. Replaces Chat ID and Message ID.',
      required: false,
    }),
    format: telegramCommons.form.parseModeProp(),
    text: Property.LongText({
      displayName: 'New Text',
      description: 'Up to 4096 characters. Replaces the whole message.',
      required: true,
    }),
    instructions_format: telegramCommons.form.formatLinkInstructions(),
    disable_web_page_preview: telegramCommons.form.linkPreviewProp(),
    reply_markup: telegramCommons.form.replyMarkupProp(),
  },
  outputSchema: editMessageTextActionOutputSchema,
  async run(ctx) {
    const hasChatTarget = Boolean(ctx.propsValue.chat_id && ctx.propsValue.message_id);
    const hasInlineTarget = Boolean(ctx.propsValue.inline_message_id);
    if (!hasChatTarget && !hasInlineTarget) {
      throw new Error(
        'Either Chat ID + Message ID, or Inline Message ID, must be provided.'
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
