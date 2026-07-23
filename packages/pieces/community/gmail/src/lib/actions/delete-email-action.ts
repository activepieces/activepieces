import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  displayName: 'Delete Email',
  description: 'Move an email to Trash.',
  audience: 'both',
  aiMetadata: {
    description:
      'Moves a single email identified by its Gmail message ID to the Trash, where Gmail permanently removes it after 30 days. Use this to discard an unwanted message. Idempotent: trashing an already-trashed message leaves it unchanged.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.trash({
      userId: 'me',
      id: context.propsValue.message_id,
    });

    return response.data;
  },
});
