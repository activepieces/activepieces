import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email by removing it from the inbox.',
  audience: 'both',
  aiMetadata: {
    description:
      'Archives a message by removing the INBOX label, moving it to All Mail without deleting it. Use this to clear an email from the inbox while keeping it searchable. Idempotent: archiving an already-archived message is a no-op.',
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

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });

    return response.data;
  },
});
