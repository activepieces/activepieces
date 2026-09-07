import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailApiErrors } from '../common/gmail-errors';
import { gmailArchiveEmailActionOutputSchema } from '../output-schemas';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Email',
  description: 'Archive an email by removing it from the inbox.',
  audience: 'both',
  aiMetadata: {
    description:
      'Archives a message by removing the INBOX label so it stays in All Mail. Use Delete Email to move a message to Trash instead. Idempotent: archiving a message that is already out of the inbox succeeds without change.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
  },
  outputSchema: gmailArchiveEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          removeLabelIds: ['INBOX'],
        },
      });
      return response.data;
    } catch (error) {
      return gmailApiErrors.throwForAction({
        error,
        action: 'archive the email',
        scopeHint: 'gmail.modify',
        notFoundMessage: `No message with ID "${context.propsValue.message_id}" was found.`,
      });
    }
  },
});
