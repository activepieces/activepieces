import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailGetDraftActionOutputSchema } from '../output-schemas';

export const gmailGetDraftAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_draft',
  displayName: 'Get Draft',
  description: 'Get a single draft email by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single draft email by its draft ID, returning the draft and its underlying message. Use this to inspect a draft before sending or updating it; obtain the draft ID from List Drafts. Idempotent: a read-only lookup that does not modify the mailbox.',
    idempotent: true,
  },
  props: {
    draft_id: Property.ShortText({
      displayName: 'Draft ID',
      description: 'The ID of the draft to read (obtain from List Drafts).',
      required: true,
    }),
  },
  outputSchema: gmailGetDraftActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.drafts.get({
        userId: 'me',
        id: context.propsValue.draft_id,
        format: 'full',
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to read drafts. Ensure the gmail.readonly scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Draft not found: "${context.propsValue.draft_id}". Use List Drafts to find a valid draft ID.`
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to get draft: ${error.message}`);
    }
  },
});
