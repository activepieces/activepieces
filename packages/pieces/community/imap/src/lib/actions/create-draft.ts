import { createAction, Property } from '@activepieces/pieces-framework';
import {
  imapAuth,
  performImapOperation,
  withMailboxLock,
  selectedMailbox,
  resolveSpecialFolder,
  buildDraftMessage,
  assertHeaderSafe,
  ImapError,
} from '../common';
import { createDraftOutputSchema } from '../output-schemas';

function toStringList(values: unknown[] | undefined): string[] {
  return (values ?? []).map((value) => String(value)).filter((value) => value.trim().length > 0);
}

export const createDraft = createAction({
  auth: imapAuth,
  name: 'create_draft',
  classification: 'WRITE',
  displayName: 'Create Draft',
  description: 'Saves a new draft email in the Drafts folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Saves a new draft (not sent) to the mailbox Drafts folder, found automatically, or to a folder you name. IMAP cannot send mail; use an SMTP or Gmail tool to send. Set in_reply_to to a Message-ID from get_email to thread the draft as a reply (only that one Message-ID is referenced). Not idempotent: every call saves another draft.',
    idempotent: false,
  },
  props: {
    to: Property.Array({
      displayName: 'To',
      description: 'Recipients, each "name@example.com" or "Name <name@example.com>".',
      required: true,
    }),
    cc: Property.Array({ displayName: 'Cc', description: 'Cc recipients.', required: false }),
    bcc: Property.Array({ displayName: 'Bcc', description: 'Bcc recipients.', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    text: Property.LongText({
      displayName: 'Text Body',
      description: 'Plain-text body. Provide this, an HTML body, or both.',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'HTML Body',
      description: 'HTML body. Provide this, a text body, or both.',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description:
        'Sender address. Defaults to the connection username when it is an email address.',
      required: false,
    }),
    in_reply_to: Property.ShortText({
      displayName: 'In Reply To',
      description: 'Message-ID of the email being answered, for example <abc@example.com>.',
      required: false,
    }),
    folder: Property.ShortText({
      displayName: 'Drafts Folder',
      description: 'Folder path to save the draft in. Leave empty to use the Drafts folder.',
      required: false,
    }),
  },
  outputSchema: createDraftOutputSchema,
  async run({ auth, propsValue }) {
    const fromInput = propsValue.from?.trim();
    const username = auth.props.username;
    const from = fromInput ? fromInput : username.includes('@') ? username : '';
    if (!from) {
      throw new ImapError('Provide a From address; the connection username is not an email address.');
    }
    const folderInput = propsValue.folder?.trim();
    if (folderInput) {
      assertHeaderSafe({ field: 'Drafts folder', value: folderInput });
    }
    const date = new Date();
    const { raw, messageId } = buildDraftMessage({
      from,
      to: toStringList(propsValue.to),
      cc: toStringList(propsValue.cc),
      bcc: toStringList(propsValue.bcc),
      subject: propsValue.subject ?? '',
      text: propsValue.text ?? undefined,
      html: propsValue.html ?? undefined,
      inReplyTo: propsValue.in_reply_to ?? undefined,
      date,
    });

    return performImapOperation(auth, async (client) => {
      const drafts = folderInput
        ? folderInput
        : (await resolveSpecialFolder({ client, role: 'drafts' }))?.path;
      if (!drafts) {
        throw new ImapError(
          'No Drafts folder was found on this server. Set Drafts Folder, or create one with create_folder.'
        );
      }
      return withMailboxLock({
        client,
        folder: drafts,
        readOnly: false,
        run: async () => {
          const result = await client.append(drafts, raw, ['\\Draft', '\\Seen'], date);
          if (!result) {
            throw new ImapError(`The server refused to save the draft in "${drafts}".`);
          }
          const mailbox = selectedMailbox({ client });
          return {
            folder: mailbox.path,
            ...(result.uid === undefined ? {} : { uid: result.uid }),
            uid_validity: (result.uidValidity ?? mailbox.uidValidity).toString(),
            message_id: messageId,
          };
        },
      });
    });
  },
});
