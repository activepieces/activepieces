import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { archiveGmailMessage } from './archive-email-action';
import { gmailArchiveEmailActionOutputSchema } from '../output-schemas';

export const gmailAiArchiveMessageAction = createAction({
  auth: gmailAuth,
  name: 'gmail_archive_message',
  classification: 'WRITE',
  displayName: 'Archive Message',
  description: 'Archive an email message by removing it from the inbox.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archives a single email message by message ID, removing the INBOX label so it no longer appears in the inbox while remaining searchable and in its thread. Does not delete the message or move it to Trash — use Trash Message for that. Obtain the message ID from Search Email or Get Message. Idempotent: true — archiving an already-archived message has no additional effect.',
    idempotent: true,
  },
  outputSchema: gmailArchiveEmailActionOutputSchema,
  props: {
    message_id: Property.ShortText({
      displayName: 'Message',
      description: 'Message ID from a Find Email step or a Gmail trigger.',
      required: true,
    }),
  },
  async run(context) {
    return archiveGmailMessage({
      auth: context.auth,
      messageId: context.propsValue.message_id,
    });
  },
});
