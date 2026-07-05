import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email (removes it from Inbox).',
  audience: 'both',
  aiMetadata: {
    description: 'Archives an individual email by removing the INBOX label.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
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
