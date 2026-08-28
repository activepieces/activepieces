import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailCreateLabelActionOutputSchema } from '../output-schemas';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  classification: 'WRITE',
  displayName: 'Create Label',
  description: 'Create a new user label in Gmail.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new user-defined label in the connected Gmail account. Provide a label name; optionally control list/visibility and color. Use this to set up categories before applying them with Add Label to Email. Requires the gmail.modify scope. Idempotency is not enforced by Gmail: creating a label with a duplicate name yields a second label, so callers should check existing labels first if uniqueness matters.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the label to create.',
      required: true,
    }),
    messageListVisibility: Property.StaticDropdown({
      displayName: 'Message List Visibility',
      description: 'Whether the label shows in the message list.',
      required: false,
      defaultValue: 'show',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'show' },
          { label: 'Hide', value: 'hide' },
        ],
      },
    }),
    labelListVisibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'Whether the label shows in the label list.',
      required: false,
      defaultValue: 'labelShow',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'labelShow' },
          { label: 'Hide', value: 'labelHide' },
        ],
      },
    }),
    backgroundColor: Property.ShortText({
      displayName: 'Background Color',
      description:
        'Optional hex color for the label background (e.g. #000000).',
      required: false,
    }),
    textColor: Property.ShortText({
      displayName: 'Text Color',
      description: 'Optional hex color for the label text (e.g. #ffffff).',
      required: false,
    }),
  },
  outputSchema: gmailCreateLabelActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const color =
      context.propsValue.backgroundColor && context.propsValue.textColor
        ? {
            backgroundColor: context.propsValue.backgroundColor,
            textColor: context.propsValue.textColor,
          }
        : undefined;

    try {
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: context.propsValue.name,
          messageListVisibility: context.propsValue.messageListVisibility,
          labelListVisibility: context.propsValue.labelListVisibility,
          color,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to create a label. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 409) {
        throw new Error(
          `A label named "${context.propsValue.name}" already exists. Use List Labels to find its ID.`
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
