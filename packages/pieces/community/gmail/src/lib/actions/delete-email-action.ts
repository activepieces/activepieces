import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_delete_email',
  displayName: 'Delete Email',
  description: 'Move an email to trash or permanently delete it.',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to delete.',
      required: true,
    }),
    permanent: Property.Checkbox({
      displayName: 'Permanently Delete',
      description: 'If enabled, permanently delete the email instead of moving it to trash.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    if (context.propsValue.permanent) {
      await gmail.users.messages.delete({
        userId: 'me',
        id: context.propsValue.message_id,
      });
    } else {
      await gmail.users.messages.trash({
        userId: 'me',
        id: context.propsValue.message_id,
      });
    }

    return {
      success: true,
      messageId: context.propsValue.message_id,
      action: context.propsValue.permanent ? 'permanently_deleted' : 'moved_to_trash',
    };
  },
});
