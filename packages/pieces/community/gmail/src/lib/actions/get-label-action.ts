import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailGetLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_label',
  displayName: 'Get Label',
  description:
    'Get a single label by its ID, including message and thread counts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single label by its label ID, returning its name, type, visibility, color, and message/thread counts. Use this to inspect a label or read how many messages carry it; obtain the label ID from List Labels. Idempotent: a read-only lookup that does not modify the mailbox.',
    idempotent: true,
  },
  props: {
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the label to read (obtain from List Labels).',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.labels.get({
        userId: 'me',
        id: context.propsValue.label_id,
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to read the label. Ensure the gmail.readonly scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Label not found: "${context.propsValue.label_id}". Use List Labels to find a valid label ID.`
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to get label: ${error.message}`);
    }
  },
});
