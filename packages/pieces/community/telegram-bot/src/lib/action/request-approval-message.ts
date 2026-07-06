import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { ExecutionType } from '@activepieces/pieces-framework';
import { requestApprovalMessageActionOutputSchema } from '../output-schemas';

export const telegramRequestApprovalMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'request_approval_message',
  displayName: 'Request Approval Message',
  description:
    'Send an approval message to a chat and wait until the message is approved or disapproved',
  audience: 'both',
  aiMetadata: { description: 'Sends a message with a single button linking to a confirmation page where the recipient chooses Approve or Disapprove, then pauses the flow until they respond and resumes with the decision. Use as a human approval gate before a sensitive downstream step. Not idempotent: each call sends a new message and opens a new pause/wait.', idempotent: false },
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The approval message to be sent',
      required: true,
    }),
    parse_mode: telegramCommons.parseModeProp(),
  },
  outputSchema: requestApprovalMessageActionOutputSchema,
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const token = context.auth.secret_text;
      const { chat_id, message, parse_mode } = context.propsValue;

      assertNotNullOrUndefined(token, 'token');
      assertNotNullOrUndefined(message, 'message');
      assertNotNullOrUndefined(chat_id, 'chat_id');

      // Generate approval and disapproval links
      const waitpoint = await context.run.createWaitpoint({
        type: 'WEBHOOK',
      });
      const confirmationLink = `${waitpoint.resumeUrl}/confirm?chat_id=${encodeURIComponent(chat_id)}`;

      // Send message with a single button opening the confirmation page (the recipient
      // chooses Approve/Disapprove there). A single link keeps the message-preview
      // prefetch from consuming the waitpoint.
      const response = await httpClient.sendRequest<{
        ok: boolean;
        result: { message_id: number };
      }>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(context.auth, 'sendMessage'),
        body: {
          chat_id,
          text: message,
          parse_mode: telegramCommons.resolveParseMode(parse_mode),
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Review & Respond',
                  url: confirmationLink,
                },
              ],
            ],
          },
        },
      });

      const messageId = response.body.result.message_id;

      context.run.waitForWaitpoint(waitpoint.id);

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
