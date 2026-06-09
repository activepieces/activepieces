import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { google } from 'googleapis';
import { convertAttachment, parseStream } from '../common/data';

export const gmailGetEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_mail',
  description: 'Get an email via Id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single email by its Gmail message ID and returns its parsed contents, including headers, body, and decoded attachments. Use this to read the full details of a specific known message, typically after a trigger or search yields its ID. Idempotent: a read-only lookup that does not modify the mailbox.',
    idempotent: true,
  },
  displayName: 'Get Email',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The messageId of the mail to read.',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const rawMailResponse = await gmail.users.messages.get({
      userId: 'me',
      id: context.propsValue.message_id!,
      format: 'raw',
    });

    const parsedMailResponse = await parseStream(
      Buffer.from(rawMailResponse.data.raw as string, 'base64').toString(
        'utf-8'
      )
    );

    return {
      id: context.propsValue.message_id,
      ...parsedMailResponse,
      attachments: await convertAttachment(
        parsedMailResponse.attachments,
        context.files
      ),
    };
  },
});
