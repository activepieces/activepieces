import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailApiErrors } from '../common/gmail-errors';
import { gmailLabels } from '../common/gmail-labels';
import { gmailAddLabelToEmailActionOutputSchema } from '../output-schemas';

export const gmailAddLabelToEmailAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  classification: 'WRITE',
  displayName: 'Add Label to Email',
  description: 'Add a label to an individual email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds an existing label to a single email message identified by its Gmail message ID. Use Create Label first if the label does not exist, or Remove Label from Email to undo. Idempotent: adding a label the message already carries succeeds without change.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to add to the email.',
      required: true,
    }),
  },
  outputSchema: gmailAddLabelToEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const labelId = gmailLabels.resolveId(context.propsValue.label);

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          addLabelIds: [labelId],
        },
      });
      return response.data;
    } catch (error) {
      return gmailApiErrors.throwForAction({
        error,
        action: 'add a label to the email',
        scopeHint: 'gmail.modify',
        notFoundMessage: `No message with ID "${context.propsValue.message_id}" was found.`,
        badRequestMessage: `Invalid label "${gmailLabels.resolveName(
          context.propsValue.label
        )}". It may have been deleted — refresh the label list and try again.`,
      });
    }
  },
});
