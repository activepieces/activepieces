import { createAction, Property } from '@activepieces/pieces-framework';
import {
  imapAuth,
  performImapOperation,
  withMailboxLock,
  selectedMailbox,
  assertUidValidity,
  partitionExistingUids,
  parseUids,
  flagsToArray,
  folderProp,
  uidsProp,
  uidValidityProp,
  ImapError,
} from '../common';
import { updateEmailFlagsOutputSchema } from '../output-schemas';

const KEYWORD_ATOM = /^[\x21-\x7e]+$/;
const KEYWORD_FORBIDDEN = /[(){%*"\\\]]/;

function parseKeywords({ values }: { values: unknown[] | undefined }): string[] {
  const keywords = (values ?? [])
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
  for (const keyword of keywords) {
    if (!KEYWORD_ATOM.test(keyword) || KEYWORD_FORBIDDEN.test(keyword)) {
      throw new ImapError(
        `"${keyword}" is not a valid keyword: use printable ASCII without spaces or any of ( ) { % * " \\ ].`
      );
    }
    if (keyword.startsWith('\\')) {
      throw new ImapError(`"${keyword}" is a system flag, not a keyword.`);
    }
  }
  return [...new Set(keywords)];
}

function toggleOption({
  on,
  off,
}: {
  on: { label: string; value: string };
  off: { label: string; value: string };
}) {
  return { options: [on, off] };
}

export const updateEmailFlags = createAction({
  auth: imapAuth,
  name: 'update_email_flags',
  classification: 'WRITE',
  displayName: 'Update Email Flags',
  description: 'Marks emails read or unread, flagged or unflagged, answered, and adds or removes keywords.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes flags on one or more emails in a folder: read/unread, flagged/unflagged, answered, and custom keywords (labels). Only the options you set are changed; everything else is left untouched. Use trash_emails or delete_emails to remove messages instead. Sets a target state, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    folder: folderProp({
      displayName: 'Folder',
      description: 'Folder path from list_folders that contains the emails.',
    }),
    uids: uidsProp(),
    uid_validity: uidValidityProp(),
    read: Property.StaticDropdown({
      displayName: 'Read Status',
      description: 'Leave empty to keep the current read status.',
      required: false,
      options: toggleOption({
        on: { label: 'Mark as Read', value: 'mark_read' },
        off: { label: 'Mark as Unread', value: 'mark_unread' },
      }),
    }),
    flagged: Property.StaticDropdown({
      displayName: 'Flagged',
      description: 'Leave empty to keep the current flagged status.',
      required: false,
      options: toggleOption({
        on: { label: 'Flag', value: 'flag' },
        off: { label: 'Unflag', value: 'unflag' },
      }),
    }),
    answered: Property.StaticDropdown({
      displayName: 'Answered',
      description: 'Leave empty to keep the current answered status.',
      required: false,
      options: toggleOption({
        on: { label: 'Mark as Answered', value: 'mark_answered' },
        off: { label: 'Mark as Not Answered', value: 'unmark_answered' },
      }),
    }),
    add_keywords: Property.Array({
      displayName: 'Add Keywords',
      description: 'Custom keywords to add, for example "invoice".',
      required: false,
    }),
    remove_keywords: Property.Array({
      displayName: 'Remove Keywords',
      description: 'Custom keywords to remove.',
      required: false,
    }),
  },
  outputSchema: updateEmailFlagsOutputSchema,
  async run({ auth, propsValue }) {
    const folder = propsValue.folder.trim();
    const uids = parseUids({ uids: propsValue.uids });
    const add: string[] = [];
    const remove: string[] = [];
    const toggles = [
      { choice: propsValue.read, on: 'mark_read', off: 'mark_unread', flag: '\\Seen' },
      { choice: propsValue.flagged, on: 'flag', off: 'unflag', flag: '\\Flagged' },
      {
        choice: propsValue.answered,
        on: 'mark_answered',
        off: 'unmark_answered',
        flag: '\\Answered',
      },
    ];
    for (const { choice, on, off, flag } of toggles) {
      if (choice === on) {
        add.push(flag);
      } else if (choice === off) {
        remove.push(flag);
      }
    }
    const addKeywords = parseKeywords({ values: propsValue.add_keywords });
    const removeKeywords = parseKeywords({ values: propsValue.remove_keywords });
    const overlap = addKeywords.filter((keyword) => removeKeywords.includes(keyword));
    if (overlap.length > 0) {
      throw new ImapError(`Keyword "${overlap[0]}" cannot be both added and removed.`);
    }
    add.push(...addKeywords);
    remove.push(...removeKeywords);
    if (add.length === 0 && remove.length === 0) {
      throw new ImapError('Choose at least one flag or keyword to change.');
    }

    return performImapOperation(auth, async (client) =>
      withMailboxLock({
        client,
        folder,
        readOnly: false,
        run: async () => {
          assertUidValidity({ client, expected: propsValue.uid_validity });
          const mailbox = selectedMailbox({ client });
          const permanent = mailbox.permanentFlags;
          const keywords = [...addKeywords, ...removeKeywords];
          if (
            keywords.length > 0 &&
            permanent &&
            !permanent.has('\\*') &&
            !keywords.every((keyword) => permanent.has(keyword))
          ) {
            throw new ImapError('This folder does not accept custom keywords.');
          }
          const { found, notFound } = await partitionExistingUids({ client, uids });
          const range = found.join(',');
          if (add.length > 0) {
            const ok = await client.messageFlagsAdd(range, add, { uid: true });
            if (!ok) {
              throw new ImapError(`The server refused to add ${add.join(', ')}.`);
            }
          }
          if (remove.length > 0) {
            const ok = await client.messageFlagsRemove(range, remove, { uid: true });
            if (!ok) {
              throw new ImapError(`The server refused to remove ${remove.join(', ')}.`);
            }
          }
          const emails: Array<{
            uid: number;
            flags: string[];
            seen: boolean;
            flagged: boolean;
            answered: boolean;
          }> = [];
          for await (const message of client.fetch(range, { uid: true, flags: true }, { uid: true })) {
            const flags = flagsToArray(message.flags);
            const missing = add.find((flag) => !flags.includes(flag));
            const lingering = remove.find((flag) => flags.includes(flag));
            if (missing || lingering) {
              throw new ImapError(
                `The server did not apply ${missing ?? lingering} to UID ${message.uid}; the folder may not allow it.`
              );
            }
            emails.push({
              uid: message.uid,
              flags,
              seen: flags.includes('\\Seen'),
              flagged: flags.includes('\\Flagged'),
              answered: flags.includes('\\Answered'),
            });
          }
          emails.sort((a, b) => a.uid - b.uid);
          return {
            folder: mailbox.path,
            uid_validity: mailbox.uidValidity.toString(),
            emails,
            not_found_uids: notFound,
          };
        },
      })
    );
  },
});
