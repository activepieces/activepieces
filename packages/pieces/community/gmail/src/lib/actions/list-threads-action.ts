import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailListThreadsAction = createAction({
  auth: gmailAuth,
  name: 'gmail_list_threads',
  displayName: 'List Threads',
  description: 'List email conversation threads in the mailbox.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists email conversation threads matching an optional Gmail search query and label filter, returning each thread ID and snippet. This is the resolver for obtaining thread IDs used by Get Thread and Reply to Thread. Resolve label IDs with List Labels. Idempotent: a read-only listing that does not modify the mailbox.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Optional Gmail search query to filter threads (e.g. "from:boss@example.com is:unread").',
      required: false,
    }),
    label_ids: Property.Array({
      displayName: 'Label IDs',
      description:
        'Optional list of label IDs to filter by (resolve via List Labels; system labels like INBOX, UNREAD are valid).',
      required: false,
    }),
    include_spam_trash: Property.Checkbox({
      displayName: 'Include Spam & Trash',
      description: 'Include threads from Spam and Trash in the results.',
      required: false,
      defaultValue: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of threads to return (1-500).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const maxResults = Math.min(
      Math.max(context.propsValue.max_results || 20, 1),
      500
    );
    const labelIds = (
      context.propsValue.label_ids as string[] | undefined
    )?.filter((id) => id !== '');

    try {
      const response = await gmail.users.threads.list({
        userId: 'me',
        maxResults,
        includeSpamTrash: context.propsValue.include_spam_trash,
        ...(context.propsValue.query?.trim()
          ? { q: context.propsValue.query.trim() }
          : {}),
        ...(labelIds && labelIds.length > 0 ? { labelIds } : {}),
      });

      const threads = response.data.threads || [];
      return {
        threads,
        count: threads.length,
        resultSizeEstimate: response.data.resultSizeEstimate,
        ...(response.data.nextPageToken
          ? { nextPageToken: response.data.nextPageToken }
          : {}),
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to list threads. Ensure the gmail.readonly scope is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to list threads: ${error.message}`);
    }
  },
});
