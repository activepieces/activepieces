import { createAction, Property } from '@activepieces/pieces-framework';
import { GmailRequests } from '../common/data';
import { GmailMessageFormat } from '../common/models';
import { gmailAuth, getAccessToken } from '../auth';

export const gmailGetThread = createAction({
  auth: gmailAuth,
  name: 'gmail_get_thread',
  description: 'Get a thread from your Gmail account via Id',
  displayName: 'Get Thread',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches an entire email conversation by its Gmail thread ID, returning every message in the thread. Use this to read a full conversation or to discover the message IDs within a thread before replying; obtain the thread ID from Search Email or List Threads. Idempotent: a read-only lookup that does not modify the mailbox.',
    idempotent: true,
  },
  props: {
    thread_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The thread Id of the mail to read',
      required: true,
    }),
    format: Property.StaticDropdown<GmailMessageFormat>({
      displayName: 'Format',
      description: 'Format of the mail',
      required: false,
      defaultValue: 'full',
      options: {
        disabled: false,
        options: [
          { value: GmailMessageFormat.MINIMAL, label: 'Minimal' },
          { value: GmailMessageFormat.FULL, label: 'Full' },
          { value: GmailMessageFormat.RAW, label: 'Raw' },
          { value: GmailMessageFormat.METADATA, label: 'Metadata' },
        ],
      },
    }),
  },
  run: async ({ auth, propsValue: { format, thread_id } }) =>
    await GmailRequests.getThread({
      access_token: await getAccessToken(auth),
      thread_id,
      format: format ?? GmailMessageFormat.FULL,
    }),
});
