import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailListDraftsActionOutputSchema } from '../output-schemas';

export const gmailListDraftsAction = createAction({
  auth: gmailAuth,
  name: 'gmail_list_drafts',
  displayName: 'List Drafts',
  description: 'List draft emails in the mailbox.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists draft emails in the connected mailbox, returning each draft ID and its associated message. This is the resolver for obtaining draft IDs used by Get Draft, Update Draft, Send Draft, and Delete Draft. Optionally narrow with a Gmail search query and bound with Max Results. Idempotent: a read-only listing that does not modify the mailbox.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Optional Gmail search query to filter drafts (e.g. "subject:invoice").',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of drafts to return (1-500).',
      required: false,
      defaultValue: 20,
    }),
  },
  outputSchema: gmailListDraftsActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const maxResults = Math.min(
      Math.max(context.propsValue.max_results || 20, 1),
      500
    );

    try {
      const response = await gmail.users.drafts.list({
        userId: 'me',
        maxResults,
        ...(context.propsValue.query?.trim()
          ? { q: context.propsValue.query.trim() }
          : {}),
      });

      const drafts = response.data.drafts || [];
      return {
        drafts,
        count: drafts.length,
        resultSizeEstimate: response.data.resultSizeEstimate,
        ...(response.data.nextPageToken
          ? { nextPageToken: response.data.nextPageToken }
          : {}),
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to list drafts. Ensure the gmail.readonly scope is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to list drafts: ${error.message}`);
    }
  },
});
