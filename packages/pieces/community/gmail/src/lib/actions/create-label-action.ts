import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_create_label',
  displayName: 'Create Label',
  description:
    'Create a label, or return the existing one if a label with the same name already exists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get-or-create a label by name: returns the existing label id when the name already exists, otherwise creates it and returns the new id. Use to ensure a label exists before applying it with Modify Email Labels; supports nested names like "Work/Projects". Idempotent: repeated calls with the same name return the same label and never create duplicates.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The label name. Use "/" to nest, e.g. "Work/Projects".',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const name = context.propsValue.name.trim();

    try {
      const existing = await gmail.users.labels.list({ userId: 'me' });
      const match = (existing.data.labels || []).find(
        (label) => label.name === name
      );
      if (match) {
        return {
          id: match.id,
          name: match.name,
          type: match.type,
          created: false,
        };
      }

      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      });
      return {
        id: response.data.id,
        name: response.data.name,
        type: response.data.type,
        created: true,
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to manage labels. Ensure the gmail.modify scope is granted (reconnect the Gmail account).'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to create label: ${error.message}`);
    }
  },
});
