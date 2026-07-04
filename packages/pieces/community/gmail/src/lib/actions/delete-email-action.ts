import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  displayName: 'Delete Email',
  description: 'Move an email to the trash.',
  audience: 'both',
  aiMetadata: {
    description:
      'Moves a message to the Trash by its message ID. This is recoverable for 30 days rather than a permanent deletion. Idempotent: trashing an already-trashed message is a no-op.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
  },
  outputSchema: {
    fields: [
      { key: 'id', label: 'Message ID' },
      { key: 'threadId', label: 'Thread ID' },
      { key: 'labelIds', label: 'Labels' },
    ],
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
