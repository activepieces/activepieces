import { createAction, Property } from '@activepieces/pieces-framework';
import { simpleParser } from 'mailparser';
import {
  imapAuth,
  performImapOperation,
  withMailboxLock,
  selectedMailbox,
  assertUidValidity,
  parseSingleUid,
  flagsToArray,
  mapParsedAddresses,
  writeAttachments,
  toIsoDate,
  folderProp,
  uidValidityProp,
  ImapEmailNotFoundError,
  ImapError,
} from '../common';
import { getEmailOutputSchema } from '../output-schemas';

const MAX_MESSAGE_BYTES = 25 * 1024 * 1024;

export const getEmail = createAction({
  auth: imapAuth,
  name: 'get_email',
  classification: 'READ',
  displayName: 'Get Email',
  description: 'Gets the full content of one email, including attachments.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches and parses one email by UID: headers, text and HTML bodies, flags, and attachments saved as files. Use after search_emails to read a specific message. The message is not marked as read. Messages over 25 MB are refused. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    folder: folderProp({
      displayName: 'Folder',
      description: 'Folder path from list_folders that contains the email.',
    }),
    uid: Property.Number({
      displayName: 'Message UID',
      description: 'UID from search_emails in the same folder.',
      required: true,
    }),
    uid_validity: uidValidityProp(),
  },
  outputSchema: getEmailOutputSchema,
  async run({ auth, propsValue, files }) {
    const folder = propsValue.folder.trim();
    const uid = parseSingleUid({ uid: propsValue.uid });
    return performImapOperation(auth, async (client) =>
      withMailboxLock({
        client,
        folder,
        readOnly: true,
        run: async () => {
          assertUidValidity({ client, expected: propsValue.uid_validity });
          const mailbox = selectedMailbox({ client });
          const meta = await client.fetchOne(
            String(uid),
            { uid: true, size: true },
            { uid: true }
          );
          if (!meta) {
            throw new ImapEmailNotFoundError();
          }
          if ((meta.size ?? 0) > MAX_MESSAGE_BYTES) {
            throw new ImapError(
              `The email is ${meta.size} bytes, above the 25 MB limit for get_email.`
            );
          }
          const message = await client.fetchOne(
            String(uid),
            { uid: true, source: true, flags: true, size: true, internalDate: true },
            { uid: true }
          );
          if (!message || !message.source) {
            throw new ImapEmailNotFoundError();
          }
          const parsed = await simpleParser(message.source);
          const from = mapParsedAddresses(parsed.from);
          const flags = flagsToArray(message.flags);
          const references = parsed.references;
          return {
            folder: mailbox.path,
            uid: message.uid,
            uid_validity: mailbox.uidValidity.toString(),
            message_id: parsed.messageId ?? null,
            in_reply_to: parsed.inReplyTo ?? null,
            references: references === undefined ? [] : Array.isArray(references) ? references : [references],
            subject: parsed.subject ?? '',
            date: toIsoDate(parsed.date),
            internal_date: toIsoDate(message.internalDate),
            from_name: from[0]?.name ?? '',
            from_address: from[0]?.address ?? '',
            to: mapParsedAddresses(parsed.to),
            cc: mapParsedAddresses(parsed.cc),
            bcc: mapParsedAddresses(parsed.bcc),
            reply_to: mapParsedAddresses(parsed.replyTo),
            text: parsed.text ?? null,
            html: parsed.html === false ? null : parsed.html,
            flags,
            seen: flags.includes('\\Seen'),
            flagged: flags.includes('\\Flagged'),
            size: message.size ?? null,
            attachments: await writeAttachments({ attachments: parsed.attachments, files }),
          };
        },
      })
    );
  },
});
