import { createAction, Property } from '@activepieces/pieces-framework';
import { type SearchObject } from 'imapflow';
import {
  imapAuth,
  performImapOperation,
  withMailboxLock,
  selectedMailbox,
  summarizeMessage,
  folderProp,
  ImapError,
  type EmailSummary,
} from '../common';
import { searchEmailsOutputSchema } from '../output-schemas';

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const searchEmails = createAction({
  auth: imapAuth,
  name: 'search_emails',
  classification: 'SEARCH',
  displayName: 'Search Emails',
  description: 'Searches a folder and returns matching email summaries, newest first.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches one IMAP folder and returns envelope summaries (uid, subject, from, to, date, flags, size) newest first, without bodies. This is the source of message UIDs for every other IMAP email tool; pass the returned uid_validity along to detect stale UIDs. All filters are combined with AND; with no filters it lists the newest messages. Use get_email to read a full message. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    folder: folderProp({
      displayName: 'Folder',
      description: 'Folder path from list_folders.',
    }),
    from: Property.ShortText({ displayName: 'From', description: 'Text contained in the From header.', required: false }),
    to: Property.ShortText({ displayName: 'To', description: 'Text contained in the To header.', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Text contained in the subject.', required: false }),
    body: Property.ShortText({ displayName: 'Body', description: 'Text contained in the message body.', required: false }),
    text: Property.ShortText({
      displayName: 'Text',
      description: 'Text contained anywhere in the headers or body.',
      required: false,
    }),
    message_id: Property.ShortText({
      displayName: 'Message-ID',
      description: 'Exact Message-ID header value, for example <abc@example.com>.',
      required: false,
    }),
    since: Property.DateTime({
      displayName: 'Received Since',
      description:
        'Only messages received on or after this date. Day granularity on most servers (time of day is ignored).',
      required: false,
    }),
    before: Property.DateTime({
      displayName: 'Received Before',
      description:
        'Only messages received before this date. Day granularity on most servers (time of day is ignored).',
      required: false,
    }),
    read_status: Property.StaticDropdown({
      displayName: 'Read Status',
      description: 'Filter by read state. Leave empty for both.',
      required: false,
      options: {
        options: [
          { label: 'Read', value: 'read' },
          { label: 'Unread', value: 'unread' },
        ],
      },
    }),
    flagged: Property.StaticDropdown({
      displayName: 'Flagged',
      description: 'Filter by the flagged (starred) state. Leave empty for both.',
      required: false,
      options: {
        options: [
          { label: 'Flagged', value: 'flagged' },
          { label: 'Not Flagged', value: 'unflagged' },
        ],
      },
    }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Only messages carrying this custom keyword (IMAP flag).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of emails to return (1-100).',
      required: false,
      defaultValue: 25,
    }),
  },
  outputSchema: searchEmailsOutputSchema,
  async run({ auth, propsValue }) {
    const folder = propsValue.folder.trim();
    const limit = propsValue.limit ?? 25;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ImapError('Limit must be a whole number between 1 and 100.');
    }
    const criteria: SearchObject = {};
    const from = optionalText(propsValue.from);
    const to = optionalText(propsValue.to);
    const subject = optionalText(propsValue.subject);
    const body = optionalText(propsValue.body);
    const text = optionalText(propsValue.text);
    const messageId = optionalText(propsValue.message_id);
    const keyword = optionalText(propsValue.keyword);
    if (from) criteria.from = from;
    if (to) criteria.to = to;
    if (subject) criteria.subject = subject;
    if (body) criteria.body = body;
    if (text) criteria.text = text;
    if (messageId) criteria.header = { 'message-id': messageId };
    if (propsValue.since) criteria.since = new Date(propsValue.since);
    if (propsValue.before) criteria.before = new Date(propsValue.before);
    if (propsValue.read_status === 'read') criteria.seen = true;
    if (propsValue.read_status === 'unread') criteria.seen = false;
    if (propsValue.flagged === 'flagged') criteria.flagged = true;
    if (propsValue.flagged === 'unflagged') criteria.flagged = false;
    if (keyword) criteria.keyword = keyword;
    if (Object.keys(criteria).length === 0) criteria.all = true;

    return performImapOperation(auth, async (client) =>
      withMailboxLock({
        client,
        folder,
        readOnly: true,
        run: async () => {
          const mailbox = selectedMailbox({ client });
          const base = {
            folder: mailbox.path,
            uid_validity: mailbox.uidValidity.toString(),
          };
          const permanent = mailbox.permanentFlags;
          const keywordDropped =
            keyword !== undefined &&
            !mailbox.flags.has(keyword) &&
            permanent !== undefined &&
            !permanent.has('\\*') &&
            !permanent.has(keyword);
          if (keywordDropped) {
            return { ...base, total_matches: 0, count: 0, emails: [] };
          }
          const matches = await client.search(criteria, { uid: true });
          if (matches === false) {
            throw new ImapError('The server rejected the search.');
          }
          const top = [...matches].sort((a, b) => b - a).slice(0, limit);
          const emails: EmailSummary[] = [];
          if (top.length > 0) {
            for await (const message of client.fetch(
              top.join(','),
              { uid: true, envelope: true, flags: true, size: true, internalDate: true },
              { uid: true }
            )) {
              emails.push(summarizeMessage({ message }));
            }
          }
          emails.sort((a, b) => b.uid - a.uid);
          return { ...base, total_matches: matches.length, count: emails.length, emails };
        },
      })
    );
  },
});
