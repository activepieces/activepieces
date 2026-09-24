import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { getGmailMessage } from './get-mail-action';
import { gmailAiGetMessageActionOutputSchema } from '../output-schemas';

export const gmailAiGetMessageAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_message',
  classification: 'READ',
  displayName: 'Get Message',
  description: 'Get a single email message by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single email by its Gmail message ID and returns its parsed contents, including headers, body, and decoded attachments (each attachment is returned with its downloaded content directly, so a separate Get Attachment call is normally unnecessary). Use this to read the full details of a specific known message; obtain the message ID from Search Email. Idempotent: a read-only lookup that does not modify the mailbox.',
    idempotent: true,
  },
  outputSchema: gmailAiGetMessageActionOutputSchema,
  props: {
    message_id: Property.ShortText({
      displayName: 'Message',
      description: 'Message ID from a Find Email step or a Gmail trigger.',
      required: true,
    }),
  },
  async run(context) {
    return getGmailMessage({
      auth: context.auth,
      messageId: context.propsValue.message_id,
      files: context.files,
    });
  },
});
