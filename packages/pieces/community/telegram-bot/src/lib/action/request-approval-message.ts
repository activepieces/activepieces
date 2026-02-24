import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';

const chatIdInfo = `
**How to obtain Chat ID:**
1. Search for the bot "@getmyid_bot" in Telegram.
2. Start a conversation with the bot.
3. Send the command "/my_id" to the bot.
4. The bot will reply with your chat ID.

**Note: Remember to initiate the chat with the bot, or you'll get an error for "chat not found."**
`;

export const telegramRequestApprovalMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'request_approval_message',
  displayName: 'Request Approval Message',
  description:
    'Send an approval message to a chat and wait until the message is approved or disapproved',
  props: {
    instructions: Property.MarkDown({
      value: chatIdInfo,
    }),
    chat_id: Property.ShortText({
      displayName: 'Chat Id',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The approval message to be sent',
      required: true,
    }),
    parse_mode: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Choose format for the message',
      required: false,
      options: {
        options: [
          {
            label: 'Markdown',
            value: 'MarkdownV2',
          },
          {
            label: 'HTML',
            value: 'HTML',
          },
          {
            label: 'Plain Text',
            value: 'None',
          },
        ],
      },
      defaultValue: 'MarkdownV2',
    }),
    approve_button_text: Property.ShortText({
      displayName: 'Approve Button Text',
      description: 'Text for the approve button',
      required: false,
      defaultValue: 'Approve',
    }),
    disapprove_button_text: Property.ShortText({
      displayName: 'Disapprove Button Text',
      description: 'Text for the disapprove button',
      required: false,
      defaultValue: 'Disapprove',
    }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const token = context.auth.secret_text;
      const { chat_id, message, parse_mode, approve_button_text, disapprove_button_text } =
        context.propsValue;

      assertNotNullOrUndefined(token, 'token');
      assertNotNullOrUndefined(message, 'message');
      assertNotNullOrUndefined(chat_id, 'chat_id');

      // Generate approval and disapproval links
      const approvalLink = context.generateResumeUrl({
        queryParams: { action: 'approve', chat_id },
      });
      const disapprovalLink = context.generateResumeUrl({
        queryParams: { action: 'disapprove', chat_id },
      });

      // Send message with inline keyboard buttons
      const response = await httpClient.sendRequest<{
        ok: boolean;
        result: { message_id: number };
      }>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(context.auth, 'sendMessage'),
        body: {
          chat_id,
          text: message,
          parse_mode: parse_mode || 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: approve_button_text || 'Approve',
                  url: approvalLink,
                },
                {
                  text: disapprove_button_text || 'Disapprove',
                  url: disapprovalLink,
                },
              ],
            ],
          },
        },
      });

      const messageId = response.body.result.message_id;

      // Pause execution waiting for webhook callback
      context.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {},
        },
      });

      return {
        approved: false, // default approval is false
        messageId,
        chatId: chat_id,
      };
    } else {
      return {
        approved: context.resumePayload.queryParams['action'] === 'approve',
        chatId: context.resumePayload.queryParams['chat_id'],
      };
    }
  },
});
