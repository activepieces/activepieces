import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailCreateLabelActionOutputSchema } from '../output-schemas';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_create_label',
  classification: 'WRITE',
  displayName: 'Create Label',
  description: 'Create a new label in the mailbox.',
  audience: 'human',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'Appears in your Gmail label list.',
      placeholder: 'Follow Up',
      required: true,
    }),
  },
  outputSchema: gmailCreateLabelActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: context.propsValue.name,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to create a label. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 400 || error.code === 409) {
        throw new Error(
          `Failed to create label "${context.propsValue.name}": ${error.message}. A label with this name may already exist.`
        );
      }
      throw new Error(`Failed to create label: ${error.message}`);
    }
  },
});
