import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email by removing it from the inbox.',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to archive.',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });

    return { success: true, messageId: context.propsValue.message_id };
  },
});
