import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { convertAttachment, parseStream } from '../common/data';

export const gmailGetEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_mail',
  description: 'Get an email via Id.',
  displayName: 'Get Email',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The messageId of the mail to read.',
      required: true,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

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
