import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailGetOrCreateLabelActionOutputSchema } from '../output-schemas';

export const gmailGetOrCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_or_create_label',
  classification: 'WRITE',
  displayName: 'Get or Create Label',
  description:
    'Get an existing label by name, creating it first if it does not exist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up a label by exact name and returns it; if no label with that name exists yet, creates it first. Use this instead of List Labels + Create Label when the label may or may not already exist, e.g. before applying it via Modify Labels. Idempotent: true — the wrapper checks first, so calling it repeatedly with the same name returns the same label (created:false on every call after the first) instead of erroring on a duplicate.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description:
        'The exact display name of the label, e.g. "Follow Up". Matching is case-sensitive.',
      required: true,
    }),
  },
  outputSchema: gmailGetOrCreateLabelActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const name = context.propsValue.name;

    try {
      const existingLabels = await gmail.users.labels.list({ userId: 'me' });
      const match = (existingLabels.data.labels ?? []).find(
        (label) => label.name === name
      );
      if (match) {
        return { ...match, created: false };
      }

      const created = await gmail.users.labels.create({
        userId: 'me',
        requestBody: { name },
      });
      return { ...created.data, created: true };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to get or create a label. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(
        `Failed to get or create label "${name}": ${error.message}`
      );
    }
  },
});
