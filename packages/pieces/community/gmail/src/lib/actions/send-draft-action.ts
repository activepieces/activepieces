import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailSendDraftActionOutputSchema } from '../output-schemas';

export const gmailSendDraftAction = createAction({
  auth: gmailAuth,
  name: 'gmail_send_draft',
  displayName: 'Send Draft',
  description: 'Send an existing draft email by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends an existing draft email identified by its draft ID, delivering it to its recipients. Use this after creating or editing a draft with Create Draft / Update Draft; obtain the draft ID from List Drafts. Not idempotent: each call sends the draft as a message.',
    idempotent: false,
  },
  props: {
    draft_id: Property.ShortText({
      displayName: 'Draft ID',
      description: 'The ID of the draft to send (obtain from List Drafts).',
      required: true,
    }),
  },
  outputSchema: gmailSendDraftActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.drafts.send({
        userId: 'me',
        requestBody: {
          id: context.propsValue.draft_id,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to send a draft. Ensure the gmail.send scope is granted.'
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
      throw new Error(`Failed to send draft: ${error.message}`);
    }
  },
});
