import { createAction, FilesService } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient, GmailAuthValue } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { convertAttachment, parseStream } from '../common/data';
import { GmailProps } from '../common/props';
import { gmailGetMailActionOutputSchema } from '../output-schemas';

export const gmailGetEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_mail',
  classification: 'READ',
  description: 'Read one email by its message ID, including attachments.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches a single email by its Gmail message ID and returns its parsed contents, including headers, body, and decoded attachments. Use this to read the full details of a specific known message, typically after a trigger or search yields its ID. Idempotent: a read-only lookup that does not modify the mailbox.',
    idempotent: true,
  },
  displayName: 'Get Email',
  props: {
    message_id: GmailProps.message,
  },
  outputSchema: gmailGetMailActionOutputSchema,
  async run(context) {
    return getGmailMessage({
      auth: context.auth,
      messageId: context.propsValue.message_id,
      files: context.files,
    });
  },
});

export async function getGmailMessage({
  auth,
  messageId,
  files,
}: GetGmailMessageParams) {
  const authClient = await createGoogleClient(auth);

  const gmail = googleGmail({ version: 'v1', auth: authClient });

  const rawMailResponse = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'raw',
  });

  const parsedMailResponse = await parseStream(
    Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
  );

  return {
    id: messageId,
    ...parsedMailResponse,
    attachments: await convertAttachment(parsedMailResponse.attachments, files),
  };
}

type GetGmailMessageParams = {
  auth: GmailAuthValue;
  messageId: string;
  files: FilesService;
};
